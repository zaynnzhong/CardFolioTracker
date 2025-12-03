import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/src/db.js';
import { getMarketInsight } from '../server/src/gemini.js';
import { verifyAuthToken, initializeFirebaseAdmin } from '../server/src/firebaseAdmin.js';

// Initialize Firebase Admin on cold start
try {
    initializeFirebaseAdmin();
} catch (error) {
    console.error('[API] Failed to initialize Firebase Admin:', error);
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
