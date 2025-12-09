import express from 'express';
import ImageKit from 'imagekit';
import multer from 'multer';
import admin from 'firebase-admin';
import { db } from './db';
import { getMarketInsight } from './gemini';
import { verifyAuthToken, initializeFirebaseAdmin } from './firebaseAdmin';
import { sendOTPEmail } from './emailService';

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

        // Attach userId to request
        (req as any).userId = decodedToken.uid;
        next();
    } catch (error: any) {
        console.error('[Auth Middleware] Error:', error);
        res.status(401).json({ error: 'Unauthorized', details: error.message });
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

// Save/Update card (user-specific)
router.post('/cards', authMiddleware, async (req, res) => {
    console.log('[Local API] POST /cards - grading info:', {
        graded: req.body.graded,
        gradeCompany: req.body.gradeCompany,
        gradeValue: req.body.gradeValue,
        autoGrade: req.body.autoGrade
    });
    try {
        const userId = (req as any).userId;
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

export default router;
