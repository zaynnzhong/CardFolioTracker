import express from 'express';
import cors from 'cors';
import apiRoutes from '../server/src/routes';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Export for Vercel
export default app;
