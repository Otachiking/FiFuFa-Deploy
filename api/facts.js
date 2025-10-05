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

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
      top_k: 50,
      top_p: 0.7,
      prompt: promptText,
      max_tokens: 250,
      temperature: 0.3,
      presence_penalty: 0.4,
      frequency_penalty: 0.3,
    };

    logger.info(`Facts requested [${validLanguage}] for topic: "${sanitizedTopic}" ${more ? "(unpopular)" : "(popular)"}`);

    const output = await replicate.run(model, { input });
    const factsRaw = output.join("");

    // Clean and format facts
    const facts = factsRaw
      .split(/\s*(?:\d+\.\s+|[-*]\s+)/)
      .filter(Boolean)
      .map((f) => f.trim().replace(/^\d+\.\s*/, ""))
      .filter((f) => f.length > 0);

    logger.success(`[${validLanguage}] (${facts.length} facts): Generated successfully`);

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
    } else if (error.message.includes("Authentication") || error.message.includes("token")) {
      res.status(401).json({ error: "API token issue. Please check configuration." });
    } else {
      res.status(500).json({ error: "Something went wrong." });
    }
  }
}