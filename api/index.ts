import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/src/db.js';
import { getMarketInsight } from '../server/src/gemini.js';
import { verifyAuthToken, initializeFirebaseAdmin } from '../server/src/firebaseAdmin.js';
import { sendOTPEmail } from '../server/src/emailService.js';
import { otpStore } from '../server/src/otpStore.js';
import admin from 'firebase-admin';
import ImageKit from 'imagekit';
import formidable from 'formidable';
import fs from 'fs';

// Initialize Firebase Admin on cold start
try {
    initializeFirebaseAdmin();
} catch (error) {
    console.error('[API] Failed to initialize Firebase Admin:', error);
}

// Initialize ImageKit lazily to prevent crashes if env vars are missing
let imagekit: ImageKit | null = null;

function getImageKit(): ImageKit {
    if (!imagekit) {
        try {
            imagekit = new ImageKit({
                publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
                privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
                urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
            });
        } catch (error) {
            console.error('[API] Failed to initialize ImageKit:', error);
            throw new Error('ImageKit is not configured properly');
        }
    }
    return imagekit;
}

// Separate handler for ImageKit upload (uses formidable, no default body parser)
async function handleImageKitUpload(req: VercelRequest, res: VercelResponse) {
    console.log('[API] POST /imagekit/upload');

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyAuthToken(token);

    if (!decodedToken) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    try {
        // Parse multipart form data
        const form = formidable({ multiples: false });

        const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
            form.parse(req as any, (err, fields, files) => {
                if (err) reject(err);
                else resolve([fields, files]);
            });
        });

        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const fileName = (Array.isArray(fields.fileName) ? fields.fileName[0] : fields.fileName) || file.originalFilename || 'upload';

        // Read file buffer
        const fileBuffer = fs.readFileSync(file.filepath);

        // Upload to ImageKit
        const ik = getImageKit();
        const result = await ik.upload({
            file: fileBuffer,
            fileName: fileName,
            folder: '/cards',
            useUniqueFileName: true,
            tags: ['card-image']
        });

        console.log('[API] Image uploaded to ImageKit:', result.fileId);

        // Clean up temp file
        fs.unlinkSync(file.filepath);

        return res.status(200).json({
            url: result.url,
            fileId: result.fileId,
            name: result.name
        });
    } catch (error: any) {
        console.error('[API] ImageKit upload error:', error);
        return res.status(500).json({ error: 'Failed to upload image', message: error.message });
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        const { url, method } = req;
        const path = url?.replace('/api', '') || '';

        console.log(`[API] ${method} ${path}`);

        // Handle ImageKit upload separately (needs formidable for multipart)
        if (method === 'POST' && path === '/imagekit/upload') {
            return handleImageKitUpload(req, res);
        }

        // Handle OTP authentication endpoints (no auth required)
        if (method === 'POST' && path === '/auth/otp/send') {
            console.log('[API] POST /auth/otp/send');
            try {
                const { email } = req.body;

                if (!email || !email.includes('@')) {
                    return res.status(400).json({ error: 'Invalid email address' });
                }

                // Generate random 6-digit code
                const code = Math.floor(100000 + Math.random() * 900000).toString();

                // Store code with 5-minute expiry in MongoDB
                const expiry = Date.now() + 5 * 60 * 1000;
                await otpStore.set(email, code, expiry);

                // Try to send code via email with 5-second timeout
                // Don't await - send email in background to avoid blocking response
                const emailPromise = Promise.race([
                    sendOTPEmail(email, code),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 5000))
                ]);

                emailPromise
                    .then(() => console.log(`[API] OTP sent to ${email}`))
                    .catch((emailError: any) => {
                        console.error(`[API] Failed to send email, but OTP is still valid`);
                        console.error(`[API] Email error details:`, emailError);
                        console.error(`[API] Email error message:`, emailError?.message);
                        console.log(`[DEV MODE] OTP Code for ${email}: ${code}`);
                        console.log(`[DEV MODE] Code expires in 5 minutes`);
                    });

                // Return immediately without waiting for email
                return res.status(200).json({ success: true, message: 'OTP code sent to your email' });
            } catch (error: any) {
                console.error('[API] Error sending OTP:', error);
                return res.status(500).json({ error: 'Failed to send OTP', details: error.message });
            }
        }

        if (method === 'POST' && path === '/auth/otp/verify') {
            console.log('[API] POST /auth/otp/verify');
            try {
                const { email, code } = req.body;

                if (!email || !code) {
                    return res.status(400).json({ error: 'Email and code are required' });
                }

                // Check if OTP exists in MongoDB
                const storedData = await otpStore.get(email);
                if (!storedData) {
                    return res.status(400).json({ error: 'Invalid or expired OTP code' });
                }

                // Verify code matches
                if (storedData.code !== code) {
                    return res.status(400).json({ error: 'Invalid OTP code' });
                }

                // Delete used OTP from MongoDB
                await otpStore.delete(email);

                // Create or get user by email
                let userRecord;
                try {
                    userRecord = await admin.auth().getUserByEmail(email);
                    console.log(`[API] Existing user found: ${userRecord.uid}`);
                } catch (error: any) {
                    if (error.code === 'auth/user-not-found') {
                        // Create new user
                        userRecord = await admin.auth().createUser({
                            email: email,
                            emailVerified: true, // OTP verification counts as email verification
                        });
                        console.log(`[API] New user created: ${userRecord.uid}`);
                    } else {
                        throw error;
                    }
                }

                // Generate custom token
                const customToken = await admin.auth().createCustomToken(userRecord.uid);

                console.log(`[API] Custom token generated for ${email}`);
                return res.status(200).json({
                    customToken,
                    uid: userRecord.uid,
                    email: userRecord.email
                });
            } catch (error: any) {
                console.error('[API] Error verifying OTP:', error);
                return res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
            }
        }

        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyAuthToken(token);

        if (!decodedToken) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        const userId = decodedToken.uid;
        console.log(`[API] Authenticated user: ${userId}`);

        try {
            // GET /api/cards
            if (method === 'GET' && path === '/cards') {
                console.log('[API] Fetching cards...');
                const cards = await db.getCards(userId);
                console.log(`[API] Found ${cards.length} cards`);
                return res.status(200).json(cards);
            }

            // POST /api/cards
            if (method === 'POST' && path === '/cards') {
                console.log('[API] Saving card:', req.body);
                const card = await db.saveCard(req.body, userId);
                console.log('[API] Card saved:', card.id);
                return res.status(200).json(card);
            }

            // DELETE /api/cards/:id
            if (method === 'DELETE' && path.startsWith('/cards/')) {
                const id = path.split('/')[2];
                console.log('[API] Deleting card:', id);
                await db.deleteCard(id, userId);
                return res.status(200).json({ success: true });
            }

            // POST /api/cards/:id/price
            if (method === 'POST' && path.match(/^\/cards\/[^/]+\/price$/)) {
                const id = path.split('/')[2];
                const { price, date, platform, variation, grade, serialNumber } = req.body;
                console.log('[API] Updating price for card:', id, 'with data:', { price, date, platform, variation, grade, serialNumber });
                const updated = await db.updatePrice(id, userId, price, date, platform, variation, grade, serialNumber);
                if (updated) {
                    return res.status(200).json(updated);
                }
                return res.status(404).json({ error: 'Card not found' });
            }

            // POST /api/gemini/insight
            if (method === 'POST' && path === '/gemini/insight') {
                console.log('[API] Getting insight for card');
                const insight = await getMarketInsight(req.body.card);
                return res.status(200).json({ insight });
            }

            // GET /api/imagekit/auth
            if (method === 'GET' && path === '/imagekit/auth') {
                console.log('[API] GET /imagekit/auth');
                const ik = getImageKit();
                const authenticationParameters = ik.getAuthenticationParameters();
                return res.status(200).json(authenticationParameters);
            }

            // ===== Trade Plans API =====

            // GET /api/trade-plans
            if (method === 'GET' && path === '/trade-plans') {
                console.log('[API] GET /trade-plans');
                // Ensure DB connection before importing model
                const { connectToDb } = await import('../server/src/db.js');
                await connectToDb();
                const { TradePlanModel } = await import('../server/src/models/tradePlan.js');
                const { status } = req.query;

                const query: any = { userId };
                if (status && ['pending', 'completed', 'cancelled'].includes(status as string)) {
                    query.status = status;
                }

                console.log(`[API] Querying trade plans with:`, JSON.stringify(query));
                const plans = await TradePlanModel.find(query).sort({ createdAt: -1 });
                console.log(`[API] Found ${plans.length} trade plans`);
                return res.status(200).json(plans);
            }

            // GET /api/trade-plans/:id
            if (method === 'GET' && path.startsWith('/trade-plans/') && !path.includes('/complete')) {
                const id = path.split('/')[2];
                console.log('[API] GET /trade-plans/:id', id);
                // Ensure DB connection before importing model
                const { connectToDb } = await import('../server/src/db.js');
                await connectToDb();
                const { TradePlanModel } = await import('../server/src/models/tradePlan.js');

                const plan = await TradePlanModel.findOne({ _id: id, userId });
                if (!plan) {
                    return res.status(404).json({ error: 'Trade plan not found' });
                }

                return res.status(200).json(plan);
            }

            // POST /api/trade-plans
            if (method === 'POST' && path === '/trade-plans') {
                console.log('[API] POST /trade-plans');
                // Ensure DB connection before importing model
                const { connectToDb } = await import('../server/src/db.js');
                await connectToDb();
                const { TradePlanModel } = await import('../server/src/models/tradePlan.js');
                const { planName, targetValue, targetCard, bundleCards, cashAmount, cashCurrency, totalBundleValue, notes } = req.body;

                if (!planName || !bundleCards || !Array.isArray(bundleCards) || bundleCards.length === 0) {
                    return res.status(400).json({ error: 'Plan name and bundle cards are required' });
                }

                if (totalBundleValue === undefined || totalBundleValue < 0) {
                    return res.status(400).json({ error: 'Total bundle value is required' });
                }

                const newPlan = new TradePlanModel({
                    userId,
                    planName,
                    targetValue,
                    targetCard,
                    bundleCards,
                    cashAmount,
                    cashCurrency,
                    totalBundleValue,
                    notes,
                    status: 'pending'
                });

                await newPlan.save();
                return res.status(201).json(newPlan);
            }

            // PUT /api/trade-plans/:id
            if (method === 'PUT' && path.startsWith('/trade-plans/') && !path.endsWith('/complete')) {
                const id = path.split('/')[2];
                console.log('[API] PUT /trade-plans/:id', id);
                const { connectToDb } = await import('../server/src/db.js');
                await connectToDb();
                const { TradePlanModel } = await import('../server/src/models/tradePlan.js');
                const updates = req.body;

                // Don't allow changing userId
                delete updates.userId;
                delete updates._id;

                const plan = await TradePlanModel.findOneAndUpdate(
                    { _id: id, userId },
                    { ...updates, updatedAt: new Date() },
                    { new: true }
                );

                if (!plan) {
                    return res.status(404).json({ error: 'Trade plan not found' });
                }

                return res.status(200).json(plan);
            }

            // DELETE /api/trade-plans/:id
            if (method === 'DELETE' && path.startsWith('/trade-plans/')) {
                const id = path.split('/')[2];
                console.log('[API] DELETE /trade-plans/:id', id);
                const { connectToDb } = await import('../server/src/db.js');
                await connectToDb();
                const { TradePlanModel } = await import('../server/src/models/tradePlan.js');

                const plan = await TradePlanModel.findOneAndDelete({ _id: id, userId });
                if (!plan) {
                    return res.status(404).json({ error: 'Trade plan not found' });
                }

                return res.status(200).json({ message: 'Trade plan deleted successfully' });
            }

            // POST /api/trade-plans/:id/complete
            if (method === 'POST' && path.match(/^\/trade-plans\/[^/]+\/complete$/)) {
                const id = path.split('/')[2];
                console.log('[API] POST /trade-plans/:id/complete', id);
                const { connectToDb } = await import('../server/src/db.js');
                await connectToDb();
                const { TradePlanModel } = await import('../server/src/models/tradePlan.js');
                const { transactionId } = req.body;

                const plan = await TradePlanModel.findOneAndUpdate(
                    { _id: id, userId, status: 'pending' },
                    {
                        status: 'completed',
                        completedTransactionId: transactionId,
                        updatedAt: new Date()
                    },
                    { new: true }
                );

                if (!plan) {
                    return res.status(404).json({ error: 'Trade plan not found or already completed' });
                }

                return res.status(200).json(plan);
            }

            // POST /api/trade-plans/migrate-currency
            if (method === 'POST' && path === '/trade-plans/migrate-currency') {
                console.log('[API] POST /trade-plans/migrate-currency');
                const { connectToDb } = await import('../server/src/db.js');
                await connectToDb();
                const { TradePlanModel } = await import('../server/src/models/tradePlan.js');

                // Find all plans without cashCurrency set
                const plansToUpdate = await TradePlanModel.find({
                    userId,
                    cashCurrency: { $exists: false }
                });

                console.log(`[API] Found ${plansToUpdate.length} plans to migrate`);

                // Update each plan to set default cashCurrency to CNY
                for (const plan of plansToUpdate) {
                    plan.cashCurrency = 'CNY';
                    await plan.save();
                }

                return res.status(200).json({
                    message: 'Migration completed',
                    updated: plansToUpdate.length
                });
            }

            // ===== Tier & Limits API =====

            // GET /api/tier/profile
            if (method === 'GET' && path === '/tier/profile') {
                console.log('[API] GET /tier/profile');
                const { tierService } = await import('../server/src/services/tierService.js');
                const userEmail = decodedToken.email || '';
                const profile = await tierService.getUserProfile(userId, userEmail);
                return res.status(200).json(profile);
            }

            // GET /api/tier/can-add-card
            if (method === 'GET' && path === '/tier/can-add-card') {
                console.log('[API] GET /tier/can-add-card');
                const { tierService } = await import('../server/src/services/tierService.js');
                const userEmail = decodedToken.email || '';
                const result = await tierService.canAddCard(userId, userEmail);
                return res.status(200).json(result);
            }

            // POST /api/tier/redeem-key
            if (method === 'POST' && path === '/tier/redeem-key') {
                console.log('[API] POST /tier/redeem-key');
                const { tierService } = await import('../server/src/services/tierService.js');
                const userEmail = decodedToken.email || '';
                const { key } = req.body;

                if (!key) {
                    return res.status(400).json({ error: 'Unlock key is required' });
                }

                const result = await tierService.redeemUnlockKey(userId, userEmail, key);
                if (result.success) {
                    return res.status(200).json(result);
                } else {
                    return res.status(400).json(result);
                }
            }

            console.log('[API] Route not found');
            return res.status(404).json({ error: 'Not found' });
        } catch (error: any) {
            console.error('[API] Error:', error);
            console.error('[API] Error stack:', error?.stack);
            console.error('[API] Error message:', error?.message);

            // Return proper JSON error
            return res.status(500).json({
                error: 'Internal server error',
                message: error?.message || 'Unknown error',
                details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
            });
        }
    } catch (outerError: any) {
        // Catch any errors that happen before we can set headers
        console.error('[API] Outer error:', outerError);
        return res.status(500).json({
            error: 'Critical server error',
            message: outerError?.message || 'Unknown error'
        });
    }
}
