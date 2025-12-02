import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/src/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        res.status(200).json({ status: 'ok', db_loaded: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message, stack: e.stack });
    }
}
