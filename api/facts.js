// Facts API - Vercel Serverless Function
import { 
  replicate, 
  model, 
  logger, 
  validateTopic, 
  validateLanguage, 
  getFactsPrompt,
  handleCors 
} from './_utils.js';

// Vercel free tier has 30s limit, use 28s to leave buffer for response
const REPLICATE_TIMEOUT_MS = Number(process.env.REPLICATE_TIMEOUT_MS || 28000);

const withTimeout = (promise, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      const timeoutError = new Error(`Replicate request exceeded ${timeoutMs}ms`);
      timeoutError.status = 504;
      reject(timeoutError);
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if API token is configured
  if (!process.env.REPLICATE_API_TOKEN) {
    logger.error('REPLICATE_API_TOKEN is not configured');
    return res.status(500).json({ error: 'Server configuration error. API token not set.' });
  }

  try {
    const { topic, language = 'en', more = false } = req.body;

    // Validation
    const topicValidation = validateTopic(topic);
    if (!topicValidation.isValid) {
      const errorMap = {
        TOPIC_REQUIRED: "Topic is required",
        TOPIC_TOO_SHORT: "Topic too short (minimum 2 characters)",
        TOPIC_TOO_LONG: "Topic too long (maximum 50 characters)"
      };
      
      logger.warn(`API request failed: ${errorMap[topicValidation.error]}`);
      return res.status(400).json({ error: errorMap[topicValidation.error] });
    }

    const validLanguage = validateLanguage(language);
    const sanitizedTopic = topicValidation.sanitizedTopic;
    
    const promptText = getFactsPrompt(sanitizedTopic, validLanguage, more);

    const input = {
      top_k: 40,
      top_p: 0.9,
      prompt: promptText,
      max_tokens: 180,
      temperature: 0.6,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    };

    logger.info(`Facts requested [${validLanguage}] for topic: "${sanitizedTopic}" ${more ? "(unpopular)" : "(popular)"}`);

    const output = await withTimeout(
      replicate.run(model, { input }),
      REPLICATE_TIMEOUT_MS
    );
    const factsRaw = output.join("");

    // Clean and format facts
    const facts = factsRaw
      .split(/\s*(?:\d+\.\s+|[-*]\s+)/)
      .filter(Boolean)
      .map((f) => f.trim().replace(/^\d+\.\s*/, ""))
      .filter((f) => f.length > 0);

    logger.success(`[${validLanguage}] (${facts.length} facts): Generated successfully`);
    logger.success(`Result: ${facts.join(',')} `);

    res.status(200).json({ facts, language: validLanguage });
  } catch (error) {
    logger.error(`Facts API Error: ${error.message}`);
    console.error("🚨 Detailed Error:", {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack?.split('\n')[0] // First line only
    });
    
    if (error.status === 429) {
      res.status(429).json({ error: "Too many requests. Please wait a moment." });
    } else if (error.status === 504 || error.message?.includes('exceeded')) {
      res.status(504).json({ error: "AI model is warming up. Please try again in a few seconds." });
    } else if (error.message?.includes("Authentication") || error.message?.includes("token") || error.message?.includes("Invalid")) {
      res.status(401).json({ error: "API authentication failed. Please check server configuration." });
    } else if (error.message?.includes("Model") || error.message?.includes("not found")) {
      res.status(500).json({ error: "AI model unavailable. Please try again later." });
    } else {
      res.status(500).json({ error: `Server error: ${error.message || 'Unknown error'}` });
    }
  }
}