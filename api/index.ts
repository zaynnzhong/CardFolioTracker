import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/src/db';
import { getMarketInsight } from '../server/src/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, method } = req;
    const path = url?.replace('/api', '') || '';

    try {
        // GET /api/cards
        if (method === 'GET' && path === '/cards') {
            const cards = await db.getCards();
            return res.json(cards);
        }

        // POST /api/cards
        if (method === 'POST' && path === '/cards') {
            const card = await db.saveCard(req.body);
            return res.json(card);
        }

        // DELETE /api/cards/:id
        if (method === 'DELETE' && path.startsWith('/cards/')) {
            const id = path.split('/')[2];
            await db.deleteCard(id);
            return res.json({ success: true });
        }

        // POST /api/cards/:id/price
        if (method === 'POST' && path.match(/^\/cards\/[^/]+\/price$/)) {
            const id = path.split('/')[2];
            const { price, date } = req.body;
            const updated = await db.updatePrice(id, price, date);
            if (updated) {
                return res.json(updated);
            }
            return res.status(404).json({ error: 'Card not found' });
        }

        // POST /api/gemini/insight
        if (method === 'POST' && path === '/gemini/insight') {
            const insight = await getMarketInsight(req.body.card);
            return res.json({ insight });
        }

        return res.status(404).json({ error: 'Not found' });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
