import express from 'express';
import ImageKit from 'imagekit';
import multer from 'multer';
import admin from 'firebase-admin';
import { db } from './db';
import { getMarketInsight } from './gemini';
import { verifyAuthToken, initializeFirebaseAdmin } from './firebaseAdmin';
import { sendOTPEmail } from './emailService';
import { tierService } from './services/tierService';
import { TradePlanModel } from './models/tradePlan';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// In-memory OTP storage (Map: email -> {code, expiry})
// In production, consider using Redis for distributed systems
const otpStore = new Map<string, { code: string; expiry: number }>();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of otpStore.entries()) {
        if (data.expiry < now) {
            otpStore.delete(email);
        }
    }
}, 5 * 60 * 1000);

// Initialize ImageKit (server-side only)
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

// Middleware to extract and verify auth token
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyAuthToken(token);

        if (!decodedToken) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Attach userId and email to request
        (req as any).userId = decodedToken.uid;
        (req as any).userEmail = decodedToken.email;
        next();
    } catch (error: any) {
        console.error('[Auth Middleware] Error:', error);
        res.status(401).json({ error: 'Unauthorized', details: error.message });
    }
};

// Admin middleware - check if user is admin
const adminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const userEmail = (req as any).userEmail;
        if (!userEmail) {
            return res.status(401).json({ error: 'Unauthorized: No email found' });
        }

        const isAdmin = await tierService.isAdmin(userEmail);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next();
    } catch (error: any) {
        console.error('[Admin Middleware] Error:', error);
        res.status(403).json({ error: 'Forbidden', details: error.message });
    }
};

// OTP Authentication Endpoints

// Send OTP code to email
router.post('/auth/otp/send', async (req, res) => {
    console.log('[Local API] POST /auth/otp/send');
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        // Generate random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store code with 5-minute expiry
        const expiry = Date.now() + 5 * 60 * 1000;
        otpStore.set(email, { code, expiry });

        // Try to send code via email
        try {
            await sendOTPEmail(email, code);
            console.log(`[Local API] OTP sent to ${email}`);
        } catch (emailError: any) {
            console.error(`[Local API] Failed to send email, but OTP is still valid`);
            console.log(`[DEV MODE] OTP Code for ${email}: ${code}`);
            console.log(`[DEV MODE] Code expires in 5 minutes`);
        }

        res.json({ success: true, message: 'OTP code sent to your email' });
    } catch (error: any) {
        console.error('[Local API] Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP', details: error.message });
    }
});

// Verify OTP code and return custom token
router.post('/auth/otp/verify', async (req, res) => {
    console.log('[Local API] POST /auth/otp/verify');
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required' });
        }

        // Check if OTP exists
        const storedData = otpStore.get(email);
        if (!storedData) {
            return res.status(400).json({ error: 'Invalid or expired OTP code' });
        }

        // Check if OTP is expired
        if (storedData.expiry < Date.now()) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'OTP code has expired' });
        }

        // Verify code matches
        if (storedData.code !== code) {
            return res.status(400).json({ error: 'Invalid OTP code' });
        }

        // Delete used OTP
        otpStore.delete(email);

        // Ensure Firebase Admin is initialized
        if (admin.apps.length === 0) {
            initializeFirebaseAdmin();
        }

        // Create or get user by email
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
            console.log(`[Local API] Existing user found: ${userRecord.uid}`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // Create new user
                userRecord = await admin.auth().createUser({
                    email: email,
                    emailVerified: true, // OTP verification counts as email verification
                });
                console.log(`[Local API] New user created: ${userRecord.uid}`);
            } else {
                throw error;
            }
        }

        // Generate custom token
        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        console.log(`[Local API] Custom token generated for ${email}`);
        res.json({
            customToken,
            uid: userRecord.uid,
            email: userRecord.email
        });
    } catch (error: any) {
        console.error('[Local API] Error verifying OTP:', error);
        res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
    }
});

// Get all cards (user-specific)
router.get('/cards', authMiddleware, async (req, res) => {
    console.log('[Local API] GET /cards');
    try {
        const userId = (req as any).userId;
        const cards = await db.getCards(userId);
        console.log(`[Local API] Found ${cards.length} cards for user ${userId}`);
        res.json(cards);
    } catch (error: any) {
        console.error('[Local API] Error fetching cards:', error);
        res.status(500).json({ error: 'Failed to fetch cards', details: error.message });
    }
});

// Save/Update card (user-specific) - with limit check for new cards
router.post('/cards', authMiddleware, async (req, res) => {
    console.log('[Local API] POST /cards - grading info:', {
        graded: req.body.graded,
        gradeCompany: req.body.gradeCompany,
        gradeValue: req.body.gradeValue,
        autoGrade: req.body.autoGrade
    });
    try {
        const userId = (req as any).userId;
        const userEmail = (req as any).userEmail;

        // Check if this is a new card (no existing card with this ID)
        const existingCards = await db.getCards(userId);
        const isNewCard = !existingCards.find(c => c.id === req.body.id);

        // If it's a new PORTFOLIO card (not watchlist), check limits
        // Watchlist cards should never count against the limit
        const isWatchlistCard = req.body.watchlist === true;
        if (isNewCard && !isWatchlistCard) {
            console.log('[Local API] Checking card limit for new portfolio card');
            const limitCheck = await tierService.canAddCard(userId, userEmail);
            if (!limitCheck.allowed) {
                return res.status(403).json({
                    error: 'Card limit reached',
                    limit: limitCheck.limit,
                    current: limitCheck.current,
                    message: limitCheck.message
                });
            }
        } else if (isNewCard && isWatchlistCard) {
            console.log('[Local API] Skipping limit check for watchlist card');
        }

        const card = await db.saveCard(req.body, userId);
        console.log('[Local API] Card saved:', card.id, 'with gradeValue:', card.gradeValue, 'autoGrade:', card.autoGrade);
        res.json(card);
    } catch (error: any) {
        console.error('[Local API] Error saving card:', error);
        res.status(500).json({ error: 'Failed to save card', details: error.message });
    }
});

// Delete card (user-specific)
router.delete('/cards/:id', authMiddleware, async (req, res) => {
    console.log('[Local API] DELETE /cards/' + req.params.id);
    try {
        const userId = (req as any).userId;
        await db.deleteCard(req.params.id, userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('[Local API] Error deleting card:', error);
        res.status(500).json({ error: 'Failed to delete card', details: error.message });
    }
});

// Update price (user-specific)
router.post('/cards/:id/price', authMiddleware, async (req, res) => {
    console.log('[Local API] POST /cards/' + req.params.id + '/price', req.body);
    try {
        const userId = (req as any).userId;
        const { price, date, platform, parallel, grade, serialNumber } = req.body;
        const updated = await db.updatePrice(req.params.id, userId, price, date, platform, parallel, grade, serialNumber);
        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ error: 'Card not found' });
        }
    } catch (error: any) {
        console.error('[Local API] Error updating price:', error);
        res.status(500).json({ error: 'Failed to update price', details: error.message });
    }
});

// Delete price entry (user-specific)
router.delete('/cards/:id/price/:priceDate', authMiddleware, async (req, res) => {
    console.log('[Local API] DELETE /cards/' + req.params.id + '/price/' + req.params.priceDate);
    try {
        const userId = (req as any).userId;
        const updated = await db.deletePriceEntry(req.params.id, userId, req.params.priceDate);
        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ error: 'Card not found' });
        }
    } catch (error: any) {
        console.error('[Local API] Error deleting price entry:', error);
        res.status(500).json({ error: 'Failed to delete price entry', details: error.message });
    }
});

// Edit price entry (user-specific)
router.put('/cards/:id/price/:priceDate', authMiddleware, async (req, res) => {
    console.log('[Local API] PUT /cards/' + req.params.id + '/price/' + req.params.priceDate, req.body);
    try {
        const userId = (req as any).userId;
        const { price, date, platform, parallel, grade, serialNumber } = req.body;
        const updated = await db.editPriceEntry(req.params.id, userId, req.params.priceDate, price, date, platform, parallel, grade, serialNumber);
        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ error: 'Card or price entry not found' });
        }
    } catch (error: any) {
        console.error('[Local API] Error editing price entry:', error);
        res.status(500).json({ error: 'Failed to edit price entry', details: error.message });
    }
});

// ImageKit Authentication Endpoint (authenticated)
router.get('/imagekit/auth', authMiddleware, async (req, res) => {
    console.log('[Local API] GET /imagekit/auth');
    try {
        const authenticationParameters = imagekit.getAuthenticationParameters();
        console.log('[Local API] ImageKit auth params generated');
        res.json(authenticationParameters);
    } catch (error: any) {
        console.error('[Local API] Error generating ImageKit auth:', error);
        res.status(500).json({ error: 'Failed to generate auth parameters', details: error.message });
    }
});

// ImageKit Upload Endpoint (server-side upload to bypass CORS)
router.post('/imagekit/upload', authMiddleware, upload.single('file'), async (req, res) => {
    console.log('[Local API] POST /imagekit/upload');
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const fileName = req.body.fileName || req.file.originalname;

        const result = await imagekit.upload({
            file: req.file.buffer,
            fileName: fileName,
            folder: '/cards',
            useUniqueFileName: true,
            tags: ['card-image']
        });

        console.log('[Local API] Image uploaded to ImageKit:', result.fileId);
        res.json({
            url: result.url,
            fileId: result.fileId,
            name: result.name
        });
    } catch (error: any) {
        console.error('[Local API] Error uploading to ImageKit:', error);
        res.status(500).json({ error: 'Failed to upload image', details: error.message });
    }
});

// Gemini Insight (authenticated)
router.post('/gemini/insight', authMiddleware, async (req, res) => {
    console.log('[Local API] POST /gemini/insight');
    try {
        const insight = await getMarketInsight(req.body.card);
        res.json({ insight });
    } catch (error: any) {
        console.error('[Local API] Error getting insight:', error);
        res.status(500).json({ error: 'Failed to get insight', details: error.message });
    }
});

// ===== Tier & Limits API =====

// Get user profile and tier info
router.get('/tier/profile', authMiddleware, async (req, res) => {
    console.log('[Local API] GET /tier/profile');
    try {
        const userId = (req as any).userId;
        const userEmail = (req as any).userEmail;
        const profile = await tierService.getUserProfile(userId, userEmail);
        res.json(profile);
    } catch (error: any) {
        console.error('[Local API] Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
    }
});

// Check if user can add a card
router.get('/tier/can-add-card', authMiddleware, async (req, res) => {
    console.log('[Local API] GET /tier/can-add-card');
    try {
        const userId = (req as any).userId;
        const userEmail = (req as any).userEmail;
        const result = await tierService.canAddCard(userId, userEmail);
        res.json(result);
    } catch (error: any) {
        console.error('[Local API] Error checking card limit:', error);
        res.status(500).json({ error: 'Failed to check limit', details: error.message });
    }
});

// Redeem unlock key
router.post('/tier/redeem-key', authMiddleware, async (req, res) => {
    console.log('[Local API] POST /tier/redeem-key');
    try {
        const userId = (req as any).userId;
        const userEmail = (req as any).userEmail;
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'Unlock key is required' });
        }

        const result = await tierService.redeemUnlockKey(userId, userEmail, key);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error: any) {
        console.error('[Local API] Error redeeming key:', error);
        res.status(500).json({ error: 'Failed to redeem key', details: error.message });
    }
});

// Get system config (public for default limit display)
router.get('/tier/config', async (req, res) => {
    console.log('[Local API] GET /tier/config');
    try {
        const config = await tierService.getSystemConfig();
        // Only return public info
        res.json({
            defaultCardLimit: config.defaultCardLimit
        });
    } catch (error: any) {
        console.error('[Local API] Error fetching config:', error);
        res.status(500).json({ error: 'Failed to fetch config', details: error.message });
    }
});

// ===== Admin API (requires admin middleware) =====

// Get full system config
router.get('/admin/config', authMiddleware, adminMiddleware, async (req, res) => {
    console.log('[Local API] GET /admin/config');
    try {
        const config = await tierService.getSystemConfig();
        res.json(config);
    } catch (error: any) {
        console.error('[Local API] Error fetching admin config:', error);
        res.status(500).json({ error: 'Failed to fetch config', details: error.message });
    }
});

// Update system config
router.put('/admin/config', authMiddleware, adminMiddleware, async (req, res) => {
    console.log('[Local API] PUT /admin/config');
    try {
        const config = await tierService.updateSystemConfig(req.body);
        res.json(config);
    } catch (error: any) {
        console.error('[Local API] Error updating config:', error);
        res.status(500).json({ error: 'Failed to update config', details: error.message });
    }
});

// Add email to whitelist
router.post('/admin/whitelist/add', authMiddleware, adminMiddleware, async (req, res) => {
    console.log('[Local API] POST /admin/whitelist/add');
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const config = await tierService.addToWhitelist(email);
        res.json(config);
    } catch (error: any) {
        console.error('[Local API] Error adding to whitelist:', error);
        res.status(500).json({ error: 'Failed to add to whitelist', details: error.message });
    }
});

// Remove email from whitelist
router.post('/admin/whitelist/remove', authMiddleware, adminMiddleware, async (req, res) => {
    console.log('[Local API] POST /admin/whitelist/remove');
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const config = await tierService.removeFromWhitelist(email);
        res.json(config);
    } catch (error: any) {
        console.error('[Local API] Error removing from whitelist:', error);
        res.status(500).json({ error: 'Failed to remove from whitelist', details: error.message });
    }
});

// Create unlock key
router.post('/admin/unlock-keys/create', authMiddleware, adminMiddleware, async (req, res) => {
    console.log('[Local API] POST /admin/unlock-keys/create');
    try {
        const { tier, cardLimit, maxUses, expiresAt } = req.body;
        if (!tier || cardLimit === undefined) {
            return res.status(400).json({ error: 'Tier and cardLimit are required' });
        }
        const key = await tierService.createUnlockKey({ tier, cardLimit, maxUses, expiresAt });
        res.json(key);
    } catch (error: any) {
        console.error('[Local API] Error creating unlock key:', error);
        res.status(500).json({ error: 'Failed to create unlock key', details: error.message });
    }
});

// List unlock keys
router.get('/admin/unlock-keys', authMiddleware, adminMiddleware, async (req, res) => {
    console.log('[Local API] GET /admin/unlock-keys');
    try {
        const keys = await tierService.listUnlockKeys();
        res.json(keys);
    } catch (error: any) {
        console.error('[Local API] Error listing unlock keys:', error);
        res.status(500).json({ error: 'Failed to list unlock keys', details: error.message });
    }
});

// Deactivate unlock key
router.post('/admin/unlock-keys/deactivate', authMiddleware, adminMiddleware, async (req, res) => {
    console.log('[Local API] POST /admin/unlock-keys/deactivate');
    try {
        const { key } = req.body;
        if (!key) {
            return res.status(400).json({ error: 'Key is required' });
        }
        const updatedKey = await tierService.deactivateUnlockKey(key);
        if (updatedKey) {
            res.json(updatedKey);
        } else {
            res.status(404).json({ error: 'Key not found' });
        }
    } catch (error: any) {
        console.error('[Local API] Error deactivating key:', error);
        res.status(500).json({ error: 'Failed to deactivate key', details: error.message });
    }
});

// ===== Trade Plans API =====

// Get all trade plans for a user
router.get('/trade-plans', authMiddleware, async (req, res) => {
    console.log('[Local API] GET /trade-plans');
    try {
        const userId = (req as any).userId;
        const { status } = req.query;

        const query: any = { userId };
        if (status && ['pending', 'completed', 'cancelled'].includes(status as string)) {
            query.status = status;
        }

        const plans = await TradePlanModel.find(query).sort({ createdAt: -1 });
        res.json(plans);
    } catch (error: any) {
        console.error('[Local API] Error fetching trade plans:', error);
        res.status(500).json({ error: 'Failed to fetch trade plans', details: error.message });
    }
});

// Get a single trade plan by ID
router.get('/trade-plans/:id', authMiddleware, async (req, res) => {
    console.log('[Local API] GET /trade-plans/:id');
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const plan = await TradePlanModel.findOne({ _id: id, userId });
        if (!plan) {
            return res.status(404).json({ error: 'Trade plan not found' });
        }

        res.json(plan);
    } catch (error: any) {
        console.error('[Local API] Error fetching trade plan:', error);
        res.status(500).json({ error: 'Failed to fetch trade plan', details: error.message });
    }
});

// Create a new trade plan
router.post('/trade-plans', authMiddleware, async (req, res) => {
    console.log('[Local API] POST /trade-plans');
    try {
        const userId = (req as any).userId;
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
        res.status(201).json(newPlan);
    } catch (error: any) {
        console.error('[Local API] Error creating trade plan:', error);
        res.status(500).json({ error: 'Failed to create trade plan', details: error.message });
    }
});

// Update a trade plan
router.put('/trade-plans/:id', authMiddleware, async (req, res) => {
    console.log('[Local API] PUT /trade-plans/:id');
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
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

        res.json(plan);
    } catch (error: any) {
        console.error('[Local API] Error updating trade plan:', error);
        res.status(500).json({ error: 'Failed to update trade plan', details: error.message });
    }
});

// Delete a trade plan
router.delete('/trade-plans/:id', authMiddleware, async (req, res) => {
    console.log('[Local API] DELETE /trade-plans/:id');
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const plan = await TradePlanModel.findOneAndDelete({ _id: id, userId });
        if (!plan) {
            return res.status(404).json({ error: 'Trade plan not found' });
        }

        res.json({ message: 'Trade plan deleted successfully' });
    } catch (error: any) {
        console.error('[Local API] Error deleting trade plan:', error);
        res.status(500).json({ error: 'Failed to delete trade plan', details: error.message });
    }
});

// Migration endpoint: Fix existing trade plans without cashCurrency
router.post('/trade-plans/migrate-currency', authMiddleware, async (req, res) => {
    console.log('[Local API] POST /trade-plans/migrate-currency');
    try {
        const userId = (req as any).userId;

        // Find all plans without cashCurrency set
        const plansToUpdate = await TradePlanModel.find({
            userId,
            cashCurrency: { $exists: false }
        });

        console.log(`[Local API] Found ${plansToUpdate.length} plans to migrate`);

        // Update each plan to set default cashCurrency to CNY
        // (assuming most users are using CNY based on the card values)
        for (const plan of plansToUpdate) {
            plan.cashCurrency = 'CNY';
            await plan.save();
        }

        res.json({
            message: 'Migration completed',
            updated: plansToUpdate.length
        });
    } catch (error: any) {
        console.error('[Local API] Error migrating trade plans:', error);
        res.status(500).json({ error: 'Failed to migrate trade plans', details: error.message });
    }
});

// Debug: Get trade plan status distribution
router.get('/trade-plans/debug/status-counts', authMiddleware, async (req, res) => {
    console.log('[Local API] GET /trade-plans/debug/status-counts');
    try {
        const userId = (req as any).userId;

        const allPlans = await TradePlanModel.find({ userId });
        const statusCounts: Record<string, number> = {};
        const planDetails: any[] = [];

        allPlans.forEach(plan => {
            const status = plan.status || 'NO_STATUS';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            planDetails.push({
                id: plan._id,
                name: plan.planName,
                status: plan.status,
                createdAt: plan.createdAt
            });
        });

        res.json({
            total: allPlans.length,
            statusCounts,
            plans: planDetails
        });
    } catch (error: any) {
        console.error('[Local API] Error getting status counts:', error);
        res.status(500).json({ error: 'Failed to get status counts', details: error.message });
    }
});

// Mark trade plan as completed
router.post('/trade-plans/:id/complete', authMiddleware, async (req, res) => {
    console.log('[Local API] POST /trade-plans/:id/complete');
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
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

        res.json(plan);
    } catch (error: any) {
        console.error('[Local API] Error completing trade plan:', error);
        res.status(500).json({ error: 'Failed to complete trade plan', details: error.message });
    }
});

// DEBUG: Check watchlist card counts
router.get('/debug/watchlist-count', verifyAuthToken, async (req, res) => {
    try {
        const userId = req.user!.uid;
        const mongoose = await import('mongoose');

        // Count total cards
        const total = await mongoose.models.Card.countDocuments({ userId });

        // Count watchlist cards
        const watchlistCount = await mongoose.models.Card.countDocuments({
            userId,
            watchlist: true
        });

        // Count portfolio cards (excluding watchlist)
        const portfolioCount = await mongoose.models.Card.countDocuments({
            userId,
            $or: [
                { watchlist: { $exists: false } },
                { watchlist: false }
            ]
        });

        // Get all watchlist cards
        const watchlistCards = await mongoose.models.Card.find({
            userId,
            watchlist: true
        }).select('player watchlist id');

        res.json({
            total,
            watchlistCount,
            portfolioCount,
            sumCheck: watchlistCount + portfolioCount,
            watchlistCards: watchlistCards.map(c => ({
                player: c.player,
                watchlist: c.watchlist,
                id: c.id
            }))
        });
    } catch (error: any) {
        console.error('[Debug] Error checking watchlist:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
