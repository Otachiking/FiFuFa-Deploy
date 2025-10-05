// Root API Endpoint - Vercel Serverless Function
import { handleCors } from './_utils.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({ 
    message: "🖐🏻 Welcome to FiFuFa Backend API on Vercel!", 
    endpoints: {
      health: "/api/health",
      facts: "POST /api/facts",
      randomWords: "GET /api/random-words"
    },
    version: "2.0.0",
    platform: "Vercel Serverless"
  });
}