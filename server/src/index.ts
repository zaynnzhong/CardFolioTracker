import dotenv from 'dotenv';
import path from 'path';

// Load server-specific .env file first (MUST be before other imports)
dotenv.config({ path: path.join(__dirname, '../.env') });
// Load root .env.local for fallback variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow your domain and localhost for development
const corsOptions = {
  origin: [
    'https://prism-cards.com',
    'https://www.prism-cards.com',
    'https://prism-cards.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:5173'
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
