// Random Words API - Vercel Serverless Function
import { 
  replicate, 
  model, 
  logger, 
  validateLanguage, 
  getRandomWordsPrompt,
  fallbackWords,
  handleCors 
} from './_utils.js';

// In-memory cache for serverless environment (note: this resets on cold starts)
const wordCaches = {
  en: { words: [], index: 0 },
  id: { words: [], index: 0 }
};

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { language = 'en' } = req.query;
    const validLanguage = validateLanguage(language);
    const cache = wordCaches[validLanguage];

    // Check if we need to refill cache
    if (cache.words.length === 0 || cache.index >= cache.words.length) {
      logger.info(`Generating new batch of random words [${validLanguage}]...`);

      try {
        const promptText = getRandomWordsPrompt(validLanguage);
        
        const input = {
          top_k: 40,
          top_p: 0.9,
          prompt: promptText,
          max_tokens: 80,
          temperature: 0.8,
          presence_penalty: 0.5,
          frequency_penalty: 0.5,
        };

        const output = await replicate.run(model, { input });
        const wordsRaw = output.join("");

        // Parse words from response
        cache.words = wordsRaw
          .replace(/\d+\.\s*/g, "") // Remove numbering
          .split(/[,\n]/) // Split by comma or newline
          .map((w) => w.trim().toLowerCase())
          .filter((w) => w.length > 0 && w.length < 25)
          .slice(0, 10);

        cache.index = 0;
        logger.info(`Generated word cache [${validLanguage}]: [${cache.words.join(", ")}]`);
      } catch (apiError) {
        logger.warn(`Replicate API failed, using fallback words [${validLanguage}]: ${apiError.message}`);
        
        // Use fallback words when API fails
        const fallbackList = fallbackWords[validLanguage];
        const shuffled = [...fallbackList].sort(() => Math.random() - 0.5);
        cache.words = shuffled.slice(0, 10);
        cache.index = 0;
        
        logger.info(`Using fallback word cache [${validLanguage}]: [${cache.words.join(", ")}]`);
      }
    }

    // Return next word from cache
    if (cache.index < cache.words.length) {
      const randomWord = cache.words[cache.index];
      cache.index++;

      logger.info(`Served random word [${validLanguage}] ${cache.index}/${cache.words.length}: "${randomWord}" (${cache.words.length - cache.index} remaining)`);
      
      res.status(200).json({
        word: randomWord,
        language: validLanguage,
        remaining: cache.words.length - cache.index,
        source: "generated"
      });
    } else {
      // Fallback to a random word if cache is empty
      const fallbackList = fallbackWords[validLanguage];
      const randomWord = fallbackList[Math.floor(Math.random() * fallbackList.length)];
      
      logger.warn(`Cache empty, using fallback word [${validLanguage}]: "${randomWord}"`);
      
      res.status(200).json({
        word: randomWord,
        language: validLanguage,
        remaining: 0,
        source: "fallback"
      });
    }
  } catch (error) {
    logger.error(`Random words API Error: ${error.message}`);
    console.error("🚨 Random Words Detailed Error:", {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack?.split('\n')[0] // First line only
    });
    
    res.status(500).json({ error: "Failed to generate random word" });
  }
}