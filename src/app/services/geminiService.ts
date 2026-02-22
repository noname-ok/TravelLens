import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  travelerTip?: string; // Add this line
}

// Rate limiting settings for Gemini 2.5 Flash Free Tier
const rateLimiter = {
  lastRequestTime: 0,
  minDelayMs: 3000, 
  requestCount: 0,
  resetTime: Date.now() + 60000,
  
  canMakeRequest(): boolean {
    const now = Date.now();
    if (now > this.resetTime) {
      this.resetTime = now + 60000;
      this.requestCount = 0;
    }
    // Gemini 2.5 Flash free tier allows ~10 RPM
    if (this.requestCount >= 10) return false;
    if (now - this.lastRequestTime < this.minDelayMs) return false;
    
    this.lastRequestTime = now;
    this.requestCount++;
    return true;
  }
};

/**
 * Exponential Backoff Utility
 * Retries the function if it hits a 429 (Rate Limit) error
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');
    if (isRateLimit && retries > 0) {
      console.warn(`⚠️ Quota hit. Retrying in ${delay / 1000}s... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2); // Double the wait time each try
    }
    throw error;
  }
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// MODEL STRINGS (Stable for Feb 2026)
const VISION_MODEL = 'gemini-2.5-flash'; 
const CHAT_MODEL = 'gemini-2.5-flash-lite'; // Higher RPD for text tasks

export interface AIExplanationResult {
  title: string;
  description: string;
  category: string;
  culturalNote?: string;
  interestingFact?: string;
}

/**
 * 1️⃣ Photo → AI Explanation
 */
export async function getImageExplanation(imageData: string): Promise<AIExplanationResult> {
  if (!genAI) throw new Error('Gemini API not initialized.');
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('⏸️ Rate limit: Please wait a few seconds before the next capture.');
  }

  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: VISION_MODEL });
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.match(/:(.*?);/)?.[1] || 'image/jpeg';

    const prompt = `You are a knowledgeable travel guide. Analyze this image for a first-time traveler. 
    Return ONLY a JSON object with: title, description (2-3 sentences), category, culturalNote (if applicable), and interestingFact.`;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI returned invalid format.');

    return JSON.parse(jsonMatch[0]) as AIExplanationResult;
  });
}

/**
 * 2️⃣ AI Chatbot (Context-Aware)
 */
export async function askAIQuestion(
  question: string,
  imageData: string,
  currentExplanation: AIExplanationResult,
  location?: string
): Promise<string> {
  if (!genAI) throw new Error('Gemini API not initialized.');

  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: VISION_MODEL });
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.match(/:(.*?);/)?.[1] || 'image/jpeg';

    const context = `
      User is looking at: ${currentExplanation.title} (${currentExplanation.category})
      Description: ${currentExplanation.description}
      Location Context: ${location || 'Unknown'}
      Question: "${question}"
      Provide a helpful, traveler-focused answer in 2-3 sentences.
    `;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      context,
    ]);

    return result.response.text();
  });
}

/**
 * 3️⃣ Text Translation + Traveler's Tip
 */
export async function translateImageText(imageData: string, targetLang = 'English'): Promise<any> {
    if (!genAI) throw new Error('Gemini API not initialized.');
    
    return withRetry(async () => {
        const model = genAI.getGenerativeModel({ model: VISION_MODEL });
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.match(/:(.*?);/)?.[1] || 'image/jpeg';

        // UPDATED PROMPT: Requesting travelerTip in the JSON output
        const prompt = `Extract the text from this image and translate it into ${targetLang}. 
        Also, provide a one-sentence 'Traveler's Tip' explaining the cultural or practical significance 
        (e.g., religious notice, local rule, or menu detail).
        
        Return ONLY a JSON object with these exact keys:
        { 
          "originalText": "...", 
          "translatedText": "...", 
          "sourceLanguage": "...", 
          "travelerTip": "..." 
        }`;

        const result = await model.generateContent([{ inlineData: { data: base64Data, mimeType } }, prompt]);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) throw new Error("No text found in image.");
        return JSON.parse(jsonMatch[0]);
    });
}

/**
 * 4️⃣ Generate Place Insights (Text-based AI for tourist destinations)
 */
export interface PlaceInsights {
  whyFamous: string;
  cautions: string[];
  considerations: string[];
  bestTimeToVisit?: string;
  estimatedDuration?: string;
}

export async function generatePlaceInsights(
  placeName: string,
  placeTypes: string[],
  address?: string,
  rating?: number
): Promise<PlaceInsights> {
  if (!genAI) throw new Error('Gemini API not initialized.');
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('⏸️ Rate limit: Please wait before requesting AI insights.');
  }

  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

    const typeContext = placeTypes.join(', ');
    const ratingText = rating ? `It has a rating of ${rating.toFixed(1)} stars.` : '';
    const addressText = address ? `Located at: ${address}.` : '';

    const prompt = `You are a knowledgeable local travel guide with expertise about "${placeName}".
    
Place Name: ${placeName}
Place Type: ${typeContext}
${addressText}
${ratingText}

IMPORTANT: Provide SPECIFIC and LOCATION-RELEVANT information about this exact place. Research this specific location's:
- Local safety concerns (crime rates, scams, environmental hazards specific to this area)
- Weather and terrain challenges particular to this location
- Cultural sensitivities and local customs at THIS specific place
- Real visitor experiences and common issues at this location
- Current local conditions and neighborhood characteristics

Return ONLY a JSON object with these exact keys:
{
  "whyFamous": "2-3 sentences explaining what makes THIS specific place famous, its unique history, cultural significance, or why travelers visit it",
  "cautions": ["array", "of", "4-6", "SPECIFIC safety warnings, local scams, environmental hazards, or behavioral rules that apply to THIS exact location and its surrounding area - be very specific to this place, not generic travel advice"],
  "considerations": ["array", "of", "4-6", "practical and location-specific tips for visiting THIS place - include best entry points, parking, accessibility, what to bring, local prices, crowds, booking requirements"],
  "bestTimeToVisit": "optimal time to visit THIS specific location (time of day, day of week, season) with reasoning based on crowds, weather, or lighting",
  "estimatedDuration": "realistic visit duration for THIS place (e.g., '1-2 hours', '30 minutes', 'half day')"
}

Make every answer location-specific. Avoid generic travel advice.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error('AI returned invalid format for place insights.');
    
    return JSON.parse(jsonMatch[0]) as PlaceInsights;
  });
}

const TARGET_LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  hi: 'Hindi',
  ar: 'Arabic',
  ms: 'Bahasa Melayu',
};

export async function generateTextEmbedding(text: string): Promise<number[] | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!apiKey) return null;

  const payload = {
    model: 'models/text-embedding-004',
    content: {
      parts: [{ text: trimmed.slice(0, 8000) }],
    },
  };

  return withRetry(async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding request failed (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    const values = json?.embedding?.values;
    if (!Array.isArray(values) || values.length === 0) {
      return null;
    }

    return values.map((value: unknown) => Number(value)).filter((value: number) => Number.isFinite(value));
  });
}

export async function translatePlainText(text: string, targetLanguageCode: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (targetLanguageCode === 'en') return text;
  if (!genAI) return text;

  const targetLanguage = TARGET_LANGUAGE_NAMES[targetLanguageCode] || 'English';

  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

    const prompt = `Translate the following text to ${targetLanguage}. Keep meaning, tone, and punctuation naturally. Return only the translated text without quotes or explanations.\n\nText:\n${trimmed}`;

    const result = await model.generateContent(prompt);
    const translated = result.response.text().trim();
    return translated || text;
  });
}