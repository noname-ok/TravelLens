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

const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const hasUsableApiKey = Boolean(
  rawApiKey
    && !rawApiKey.toLowerCase().startsWith('your_')
    && !rawApiKey.toLowerCase().startsWith('api_key_for_')
    && !rawApiKey.toLowerCase().includes('your_api_key_here'),
);
const apiKey = hasUsableApiKey ? rawApiKey : '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const GEMINI_NOT_CONFIGURED_MESSAGE =
  'Gemini API not initialized. Add VITE_GEMINI_API_KEY in .env and restart the dev server.';

export function isGeminiConfigured(): boolean {
  return Boolean(genAI);
}

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
  if (!genAI) throw new Error(GEMINI_NOT_CONFIGURED_MESSAGE);
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
  location?: string,
  targetLanguageCode = 'en',
): Promise<string> {
  if (!genAI) throw new Error(GEMINI_NOT_CONFIGURED_MESSAGE);

  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: VISION_MODEL });
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.match(/:(.*?);/)?.[1] || 'image/jpeg';

    const targetLanguage = getGeminiTargetLanguageName(targetLanguageCode);

    const context = `
      User is looking at: ${currentExplanation.title} (${currentExplanation.category})
      Description: ${currentExplanation.description}
      Location Context: ${location || 'Unknown'}
      Question: "${question}"
      Respond in ${targetLanguage}.
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
  if (!genAI) throw new Error(GEMINI_NOT_CONFIGURED_MESSAGE);
    
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
  rating?: number,
): Promise<PlaceInsights> {
  if (!genAI) throw new Error(GEMINI_NOT_CONFIGURED_MESSAGE);
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

IMPORTANT: Provide SPECIFIC and LOCATION-RELEVANT information about this exact place.

Return ONLY a JSON object with these exact keys:
{
  "whyFamous": "2-3 sentences explaining what makes THIS specific place famous",
  "cautions": ["4-6 specific cautions for this location"],
  "considerations": ["4-6 practical tips for this location"],
  "bestTimeToVisit": "best time to visit",
  "estimatedDuration": "realistic visit duration"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error('AI returned invalid format for place insights.');

    return JSON.parse(jsonMatch[0]) as PlaceInsights;
  });
}

/**
 * 5️⃣ AI Trip Planning - Generate Itinerary
 */
export interface PlaceForItinerary {
  name: string;
  address: string;
  lat: number;
  lng: number;
  estimatedDuration: number;
}

export interface ItineraryResponse {
  itinerary: Array<{
    day: number;
    time: string;
    place: string;
    duration: number;
    description: string;
    estimatedTravelTime: number;
    notes: string;
  }>;
  summary: string;
  highlights: string[];
  tips: string[];
}

export async function generateTripItinerary(
  places: PlaceForItinerary[],
  numberOfDays: number,
  startDate: string,
  preferences?: string[],
): Promise<ItineraryResponse> {
  if (!genAI) throw new Error(GEMINI_NOT_CONFIGURED_MESSAGE);

  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

    const placesList = places
      .map((place, index) => `${index + 1}. ${place.name} (${place.address}) - Duration: ${place.estimatedDuration}h`)
      .join('\n');

    const prompt = `You are an expert travel planner. Create a detailed ${numberOfDays}-day trip itinerary starting from ${startDate}.

Places to visit:
${placesList}

Preferences: ${preferences?.join(', ') || 'General exploration'}

Return ONLY a JSON object with this exact structure:
{
  "itinerary": [{
    "day": 1,
    "time": "09:00",
    "place": "Place Name",
    "duration": 2,
    "description": "What to do here and why",
    "estimatedTravelTime": 15,
    "notes": "Any special tips or information"
  }],
  "summary": "Brief overview of the entire trip",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "tips": ["Cultural tip", "Practical tip", "Safety tip"]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error('AI returned invalid itinerary format.');

    return JSON.parse(jsonMatch[0]) as ItineraryResponse;
  });
}

/**
 * 6️⃣ AI Trip Planning - Find Places by Preference
 */
export interface PreferencePlacesResponse {
  recommendedPlaces: Array<{
    name: string;
    type: string;
    estimatedDuration: number;
    whyRecommended: string;
  }>;
  summary: string;
}

export async function findPlacesByPreference(
  preferences: string[],
  numberOfDays: number,
  location: string,
): Promise<PreferencePlacesResponse> {
  if (!genAI) throw new Error(GEMINI_NOT_CONFIGURED_MESSAGE);

  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

    const prompt = `You are an expert travel guide. Suggest ${Math.min(preferences.length * 2, 8)} specific, real places to visit in ${location} based on these preferences: ${preferences.join(', ')}.

For a ${numberOfDays}-day trip, recommend places that:
- Exist in reality
- Match the user's preferences
- Are reasonably accessible
- Fit the timeframe

Return ONLY a JSON object with this exact structure:
{
  "recommendedPlaces": [
    {
      "name": "Exact place name",
      "type": "Category",
      "estimatedDuration": 2,
      "whyRecommended": "Why this matches their preferences"
    }
  ],
  "summary": "Brief explanation of the selection"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error('AI returned invalid places format.');

    return JSON.parse(jsonMatch[0]) as PreferencePlacesResponse;
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

export const getGeminiTargetLanguageName = (languageCode?: string): string => {
  if (!languageCode) return 'English';
  return TARGET_LANGUAGE_NAMES[languageCode] || 'English';
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

    return values
      .map((value: unknown) => Number(value))
      .filter((value: number) => Number.isFinite(value));
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

export interface JournalTranslationInput {
  title: string;
  location: string;
  description: string;
}

export async function translateJournalFields(
  input: JournalTranslationInput,
  targetLanguageCode: string,
): Promise<JournalTranslationInput> {
  const normalizedCode = (targetLanguageCode || 'en').toLowerCase().startsWith('zh')
    ? 'zh'
    : ((targetLanguageCode || 'en').toLowerCase().split(/[-_]/)[0] || 'en');

  if (normalizedCode === 'en') return input;
  if (!genAI) return input;

  const targetLanguage = TARGET_LANGUAGE_NAMES[normalizedCode] || 'English';

  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
    const prompt = `Translate this travel journal content to ${targetLanguage}. Keep meaning and natural tone. Return ONLY valid JSON with keys: title, location, description.\n\nInput JSON:\n${JSON.stringify(input)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return input;

    try {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<JournalTranslationInput>;
      return {
        title: String(parsed.title || input.title),
        location: String(parsed.location || input.location),
        description: String(parsed.description || input.description),
      };
    } catch {
      return input;
    }
  });
}

export interface CommentSummaryResult {
  summary: string;
  sentiment: 'positive' | 'mixed' | 'cautious';
  keyTopics: string[];
  travelerTips: string[];
  basedOnCommentCount: number;
}

const fallbackCommentSummary = (
  placeTitle: string,
  placeLocation: string,
  commentCount: number,
): CommentSummaryResult => {
  return {
    summary:
      commentCount > 0
        ? `Travelers are sharing early impressions about ${placeTitle}. Overall feedback is still limited, so use these notes as a quick orientation before visiting.`
        : `There are not enough comments yet for a strong crowd summary about ${placeTitle}, so here are practical tips for first-time visitors.`,
    sentiment: 'mixed',
    keyTopics: ['Crowd feedback still limited', 'Practical planning', 'On-site awareness'],
    travelerTips: [
      `Check opening hours and ticket requirements for ${placeLocation || placeTitle} before heading out.`,
      'Arrive earlier in the day to avoid peak crowds and heat when possible.',
      'Carry water, keep valuables secure, and verify transport options for your return trip.',
    ],
    basedOnCommentCount: commentCount,
  };
};

export async function generateCommentSummary(
  placeTitle: string,
  placeLocation: string,
  placeDescription: string,
  comments: Array<{ author?: string; text: string }>,
): Promise<CommentSummaryResult> {
  const cleanedComments = comments
    .map((entry) => ({
      author: (entry.author || 'Traveler').trim(),
      text: entry.text.trim(),
    }))
    .filter((entry) => entry.text.length > 0 && entry.text.toLowerCase() !== 'comment deleted')
    .slice(0, 40);

  const commentCount = cleanedComments.length;
  if (!genAI) {
    return fallbackCommentSummary(placeTitle, placeLocation, commentCount);
  }

  return withRetry(async () => {
    try {
      const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

      const commentsBlock = cleanedComments.length
        ? cleanedComments
            .map((entry, index) => `${index + 1}. ${entry.author}: ${entry.text}`)
            .join('\n')
        : 'No comments yet.';

      const prompt = `You are a helpful travel community analyst.

Place:
- Title: ${placeTitle}
- Location: ${placeLocation}
- Description: ${placeDescription}

Community comments (${commentCount}):
${commentsBlock}

Task:
1) Summarize what travelers are saying in 2-3 concise sentences.
2) Identify overall sentiment as one of: positive, mixed, cautious.
3) List 2-4 key topics discussed.
4) If comments are fewer than 4 or low-detail, include 3 practical "travelerTips" that a visitor should know.

Return ONLY valid JSON with this exact shape:
{
  "summary": "...",
  "sentiment": "positive | mixed | cautious",
  "keyTopics": ["..."],
  "travelerTips": ["..."],
  "basedOnCommentCount": ${commentCount}
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return fallbackCommentSummary(placeTitle, placeLocation, commentCount);
      }

      const parsed = JSON.parse(jsonMatch[0]) as Partial<CommentSummaryResult>;
      const sentiment = parsed.sentiment;

      return {
        summary: (parsed.summary || '').trim() || fallbackCommentSummary(placeTitle, placeLocation, commentCount).summary,
        sentiment:
          sentiment === 'positive' || sentiment === 'mixed' || sentiment === 'cautious'
            ? sentiment
            : 'mixed',
        keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics.filter(Boolean).slice(0, 4) : [],
        travelerTips: Array.isArray(parsed.travelerTips)
          ? parsed.travelerTips.filter(Boolean).slice(0, 4)
          : fallbackCommentSummary(placeTitle, placeLocation, commentCount).travelerTips,
        basedOnCommentCount: Number.isFinite(Number(parsed.basedOnCommentCount))
          ? Number(parsed.basedOnCommentCount)
          : commentCount,
      };
    } catch (error) {
      console.error('Error generating comment summary:', error);
      return fallbackCommentSummary(placeTitle, placeLocation, commentCount);
    }
  });
}