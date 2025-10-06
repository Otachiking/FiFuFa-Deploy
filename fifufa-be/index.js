// FiFuFa (Five Fun Facts) 🖻💡 by Muhammad Iqbal Rasyid - Telkom University
// Bilingual Backend API: generates 5 interesting facts about a user-provided topic
// Powered by IBM Granite Instruct v3.3-8B via Replicate API
// Languages: English & Indonesian

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Replicate from "replicate";
import { logger } from "./src/utils/logger.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Replicate setup
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  userAgent: "FiFuFa/1.0.0 (https://github.com/Otachiking/FiFuFa-Ver4)",
  fetch: (url, options) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://fifufa-ver4.onrender.com',
      }
    });
  }
});

// Log environment check
console.log("🔧 Environment Check:");
console.log("- REPLICATE_API_TOKEN:", process.env.REPLICATE_API_TOKEN ? "✅ Set" : "❌ Missing");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- PORT:", process.env.PORT);

const model = "ibm-granite/granite-3.3-8b-instruct:618ecbe80773609e96ea19d8c96e708f6f2b368bb89be8fad509983194466bf8";

// Language-specific word caches
const wordCaches = {
  en: { words: [], index: 0 },
  id: { words: [], index: 0 }
};

// Fallback word lists when Replicate API fails
const fallbackWords = {
  en: [
    "ninja", "einstein", "pizza", "dolphins", "aurora", "chocolate", "robots", "space", "ocean", "mountains",
    "dragons", "crystals", "volcanoes", "antarctica", "pyramids", "sakura", "thunder", "diamonds", "galaxies", "rainbows"
  ],
  id: [
    "rendang", "borobudur", "komodo", "batik", "gamelan", "wayang", "angklung", "raisa", "sunda", "java",
    "bali", "lombok", "sulawesi", "kalimantan", "sumatra", "papua", "maluku", "nusantara", "majapahit", "sriwijaya"
  ]
};

// Utility functions
const validateTopic = (topic) => {
  if (!topic || typeof topic !== "string") {
    return { isValid: false, error: "TOPIC_REQUIRED" };
  }

  const sanitizedTopic = topic.trim();
  
  if (sanitizedTopic.length < 2) {
    return { isValid: false, error: "TOPIC_TOO_SHORT" };
  }
  
  if (sanitizedTopic.length > 50) {
    return { isValid: false, error: "TOPIC_TOO_LONG" };
  }

  return { isValid: true, sanitizedTopic };
};

const validateLanguage = (language) => {
  const supportedLanguages = ['en', 'id'];
  return supportedLanguages.includes(language) ? language : 'en';
};

const getFactsPrompt = (topic, language, isMore = false) => {
  const prompts = {
    en: {
      popular: `List 5 popular facts about ${topic}. Each <35 words & give relevant emojis`,
      unpopular: `(facts 6-10) List 5 unpopular facts about ${topic}. Each <35 word & give relevant emojis. Be Unique`
    },
    id: {
      popular: `Beri 5 fakta ringkas umum soal ${topic}. Per fakta beri emoji relevan, fakta SINGKAT AJA. Each <15 words. Pakai Bahasa Indonesia`,
      unpopular: `Beri 5 fakta ringkas unpopular soal ${topic}. Each <15 words.  Per fakta beri emoji relevan, fakta SINGKAT AJA. Pakai Bahasa Indonesia`
    }
  };
  
  const langPrompts = prompts[language] || prompts.en;
  return isMore ? langPrompts.unpopular : langPrompts.popular;
};

const getRandomWordsPrompt = (language) => {
  const prompts = {
    en: `Say 7 specific topics from countries, history, pop culture, hobbies, etc. Separated commas, NOT list, max 2 terms each.`,
    id: `Sebut 7 topik spesifik dari Indonesia soal sejarah, budaya pop, hobi, dll. Dipisah koma, BUKAN list, maks 2 kata per topik.`
  };
  
  return prompts[language] || prompts.en;
};

// Facts API endpoint
app.post("/api/facts", async (req, res) => {
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
    logger.success(`Result: ${facts} `);

    res.json({ facts, language: validLanguage });
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
});

// Random words endpoint
app.get("/api/random-words", async (req, res) => {
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
          top_k: 50,
          top_p: 0.9,
          prompt: promptText,
          max_tokens: 150,
          temperature: 0.8,
          presence_penalty: 0.7,
          frequency_penalty: 0.7,
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
      
      res.json({
        word: randomWord,
        language: validLanguage,
        remaining: cache.words.length - cache.index,
        source: cache.words.includes(randomWord) ? "generated" : "fallback"
      });
    } else {
      logger.error(`No words available in cache [${validLanguage}]`);
      res.status(500).json({ error: "No words available" });
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
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "FiFuFa Bilingual API is running!" });
});

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "🖐🏻 Welcome to FiFuFa Backend API!", 
    endpoints: {
      health: "/health",
      facts: "POST /api/facts",
      randomWords: "GET /api/random-words"
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.success(`✅ FiFuFa Bilingual Backend started on http://localhost:${PORT}`);
  logger.info(`🌍 Supported languages: English (en), Indonesian (id)`);
});