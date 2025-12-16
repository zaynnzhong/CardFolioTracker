import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables (must be before other imports)
dotenv.config({ path: path.join(__dirname, '../server/.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import express from 'express';
import cors from 'cors';
import apiRoutes from '../server/src/routes';

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'https://prism-cards.com',
    'https://www.prism-cards.com',
    'https://prism-cards.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Mount API routes at /api
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Export the Express app as a serverless function
export default async (req: VercelRequest, res: VercelResponse) => {
  // Convert Vercel request to Express-compatible request
  // and pass to Express app handler
  return app(req as any, res as any);
}
