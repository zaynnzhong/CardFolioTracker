import express from 'express';
import { db } from './db';
import { getMarketInsight } from './gemini';
import { verifyAuthToken } from './firebaseAdmin';

const router = express.Router();

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
    console.log('[Local API] POST /cards', req.body);
    try {
        const userId = (req as any).userId;
        const card = await db.saveCard(req.body, userId);
        console.log('[Local API] Card saved:', card.id);
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
    console.log('[Local API] POST /cards/' + req.params.id + '/price');
    try {
        const userId = (req as any).userId;
        const { price, date } = req.body;
        const updated = await db.updatePrice(req.params.id, userId, price, date);
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
