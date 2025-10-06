// Health Check API - Vercel Serverless Function
import { handleCors } from './_utils.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log startup info similar to backend
  console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [SUCCESS] ✅ FiFuFa Bilingual API is running on Vercel!`);
  console.log(`[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [INFO] 🌍 Supported languages: English (en), Indonesian (id)`);

  res.status(200).json({ 
    status: "OK", 
    message: "FiFuFa Bilingual API is running on Vercel!",
    timestamp: new Date().toISOString()
  });
}