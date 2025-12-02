import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({ 
        status: 'ok',
        message: 'Test endpoint working',
        env: {
            hasMongoUri: !!process.env.MONGODB_URI,
            hasFirebaseKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
            hasGeminiKey: !!process.env.GEMINI_API_KEY
        }
    });
}
