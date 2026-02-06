// Shared utilities for Vercel serverless functions
import Replicate from "replicate";

const DEFAULT_LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000"
];

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const derivedOrigins = [
  process.env.FRONTEND_URL,
  process.env.PUBLIC_FRONTEND_URL,
  process.env.SITE_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...envOrigins, ...derivedOrigins, ...DEFAULT_LOCAL_ORIGINS])
);

export const allowedOriginsList = allowedOrigins;

const defaultServerOrigin = allowedOrigins[0] || "http://localhost:5173";

if (!process.env.REPLICATE_API_TOKEN) {
  console.warn("[WARN] REPLICATE_API_TOKEN is not set. Serverless routes will fail until it is configured.");
}

// Initialize Replicate client
export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  userAgent: "FiFuFa/1.0.0 (https://github.com/Otachiking/FiFuFa-Ver4)",
  fetch: (url, options) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': defaultServerOrigin,
      }
    });
  }
});

export const model = "ibm-granite/granite-3.3-8b-instruct:618ecbe80773609e96ea19d8c96e708f6f2b368bb89be8fad509983194466bf8";

// Simple logger for serverless environment
export const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `[${timestamp}] [INFO] ${message}`;
    console.log(logMessage);
  },
  error: (message) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `[${timestamp}] [ERROR] ${message}`;
    console.error(logMessage);
  },
  warn: (message) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `[${timestamp}] [WARN] ${message}`;
    console.warn(logMessage);
  },
  success: (message) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `[${timestamp}] [SUCCESS] ${message}`;
    console.log(logMessage);
  }
};

// Validation functions
export const validateTopic = (topic) => {
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

export const validateLanguage = (language) => {
  const supportedLanguages = ['en', 'id'];
  return supportedLanguages.includes(language) ? language : 'en';
};

// Prompt generation functions
export const getFactsPrompt = (topic, language, isMore = false) => {
  const prompts = {
    en: {
      popular: `List 5 popular facts about ${topic}. Each <35 words & give relevant emojis`,
      unpopular: `(facts 6-10) List 5 unpopular facts about ${topic}. Each <35 word & give relevant emojis. Be Unique`
    },
    id: {
      popular: `Beri 5 fakta ringkas umum soal ${topic}. Per fakta beri emoji relevan per fakta SINGKAT AJA. Each <15 words. Pakai Bahasa Indonesia`,
      unpopular: `Beri 5 fakta ringkas unpopular soal ${topic}. Each <15 words.  Per fakta beri emoji relevan per fakta SINGKAT AJA. Pakai Bahasa Indonesia`
    }
  };
  
  const langPrompts = prompts[language] || prompts.en;
  return isMore ? langPrompts.unpopular : langPrompts.popular;
};

export const getRandomWordsPrompt = (language) => {
  const prompts = {
    en: `Say 7 specific topics from countries, history, pop culture, hobbies, etc. Separated commas, NOT list, max 2 terms each.`,
    id: `Sebut 7 topik spesifik dari Indonesia soal sejarah, budaya pop, hobi, dll. Dipisah koma, BUKAN list, maks 2 kata per topik.`
  };
  
  return prompts[language] || prompts.en;
};

// Fallback word lists when Replicate API fails
export const fallbackWords = {
  en: [
    "ninja", "einstein", "pizza", "dolphins", "aurora", "chocolate", "robots", "space", "ocean", "mountains",
    "dragons", "crystals", "volcanoes", "antarctica", "pyramids", "sakura", "thunder", "diamonds", "galaxies", "rainbows"
  ],
  id: [
    "rendang", "borobudur", "komodo", "batik", "gamelan", "wayang", "angklung", "raisa", "sunda", "java",
    "bali", "lombok", "sulawesi", "kalimantan", "sumatra", "papua", "maluku", "nusantara", "majapahit", "sriwijaya"
  ]
};

const resolveOriginFromHeaders = (req) => {
  if (req.headers.origin) {
    return req.headers.origin;
  }
  if (req.headers.referer) {
    try {
      const refererUrl = new URL(req.headers.referer);
      return refererUrl.origin;
    } catch {
      return null;
    }
  }
  return null;
};

const isTrustedOrigin = (origin) => {
  if (!origin) {
    return true;
  }
  if (allowedOrigins.length === 0) {
    return true;
  }
  return allowedOrigins.includes(origin);
};

const buildCorsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin'
});

// Handle CORS preflight
export const handleCors = (req, res) => {
  const origin = resolveOriginFromHeaders(req);

  if (origin && !isTrustedOrigin(origin)) {
    logger.warn(`Blocked request from unauthorized origin: ${origin}`);
    res.status(403).json({ error: 'Origin not allowed' });
    return true;
  }

  const headers = buildCorsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
};