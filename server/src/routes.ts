import express from 'express';
import { db } from './db';
import { getMarketInsight } from './gemini';

const router = express.Router();

// Get all cards
router.get('/cards', async (req, res) => {
    try {
        const cards = await db.getCards();
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});

// Save/Update card
router.post('/cards', async (req, res) => {
    try {
        const card = await db.saveCard(req.body);
        res.json(card);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save card' });
    }
});

// Delete card
router.delete('/cards/:id', async (req, res) => {
    try {
        await db.deleteCard(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

// Update price
router.post('/cards/:id/price', async (req, res) => {
    try {
        const { price, date } = req.body;
        const updated = await db.updatePrice(req.params.id, price, date);
        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ error: 'Card not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update price' });
    }
});

// Gemini Insight
router.post('/gemini/insight', async (req, res) => {
    try {
        const insight = await getMarketInsight(req.body.card);
        res.json({ insight });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get insight' });
    }
});

export default router;
