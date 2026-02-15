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