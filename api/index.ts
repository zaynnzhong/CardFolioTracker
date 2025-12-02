import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/src/db';
import { getMarketInsight } from '../server/src/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        const { url, method } = req;
        const path = url?.replace('/api', '') || '';

        console.log(`[API] ${method} ${path}`);

        try {
            // GET /api/cards
            if (method === 'GET' && path === '/cards') {
                console.log('[API] Fetching cards...');
                const cards = await db.getCards();
                console.log(`[API] Found ${cards.length} cards`);
                return res.status(200).json(cards);
            }

            // POST /api/cards
            if (method === 'POST' && path === '/cards') {
                console.log('[API] Saving card:', req.body);
                const card = await db.saveCard(req.body);
                console.log('[API] Card saved:', card.id);
                return res.status(200).json(card);
            }

            // DELETE /api/cards/:id
            if (method === 'DELETE' && path.startsWith('/cards/')) {
                const id = path.split('/')[2];
                console.log('[API] Deleting card:', id);
                await db.deleteCard(id);
                return res.status(200).json({ success: true });
            }

            // POST /api/cards/:id/price
            if (method === 'POST' && path.match(/^\/cards\/[^/]+\/price$/)) {
                const id = path.split('/')[2];
                const { price, date } = req.body;
                console.log('[API] Updating price for card:', id);
                const updated = await db.updatePrice(id, price, date);
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
