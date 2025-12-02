import express from 'express';
import { db } from './db';
import { getMarketInsight } from './gemini';

const router = express.Router();

// Get all cards
router.get('/cards', async (req, res) => {
    console.log('[Local API] GET /cards');
    try {
        const cards = await db.getCards();
        console.log(`[Local API] Found ${cards.length} cards`);
        res.json(cards);
    } catch (error: any) {
        console.error('[Local API] Error fetching cards:', error);
        res.status(500).json({ error: 'Failed to fetch cards', details: error.message });
    }
});

// Save/Update card
router.post('/cards', async (req, res) => {
    console.log('[Local API] POST /cards', req.body);
    try {
        const card = await db.saveCard(req.body);
        console.log('[Local API] Card saved:', card.id);
        res.json(card);
    } catch (error: any) {
        console.error('[Local API] Error saving card:', error);
        res.status(500).json({ error: 'Failed to save card', details: error.message });
    }
});

// Delete card
router.delete('/cards/:id', async (req, res) => {
    console.log('[Local API] DELETE /cards/' + req.params.id);
    try {
        await db.deleteCard(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        console.error('[Local API] Error deleting card:', error);
        res.status(500).json({ error: 'Failed to delete card', details: error.message });
    }
});

// Update price
router.post('/cards/:id/price', async (req, res) => {
    console.log('[Local API] POST /cards/' + req.params.id + '/price');
    try {
        const { price, date } = req.body;
        const updated = await db.updatePrice(req.params.id, price, date);
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

// Gemini Insight
router.post('/gemini/insight', async (req, res) => {
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
