import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting for free tier
const rateLimiter = {
  lastRequestTime: 0,
  minDelayMs: 5000, 
  requestCount: 0,
  resetTime: Date.now() + 60000,
  
  canMakeRequest(): boolean {
    const now = Date.now();
    if (now > this.resetTime) {
      this.resetTime = now + 60000;
      this.requestCount = 0;
    }
if (this.requestCount >= 15) return false; // Allows 10 requests per minute    if (now - this.lastRequestTime < this.minDelayMs) return false;
    
    this.lastRequestTime = now;
    this.requestCount++;
    return true;
  }
};

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface AIExplanationResult {
  title: string;
  description: string;
  category: string;
  culturalNote?: string;
  interestingFact?: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export async function getImageExplanation(imageData: string): Promise<AIExplanationResult> {
  if (!genAI) throw new Error('Gemini API not initialized.');
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('⏸️ Rate limit hit! Free tier allows ~1 request per minute.');
  }

  try {
    const parts = imageData.split(',');
    if (parts.length < 2 || !parts[1]) {
      throw new Error('Captured image data is empty.');
    }
    const base64Data = parts[1];
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';

    // Model selection with fallback
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } catch (e) {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    const prompt = `You are a knowledgeable travel guide assistant helping travelers understand places and objects.
    Analyze this image and provide a JSON response with keys: title, description, category, culturalNote, and interestingFact.`;

    const response = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    const responseText = response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    return JSON.parse(jsonMatch[0]) as AIExplanationResult;

  } catch (error: any) {
    let userMessage = 'AI analysis failed. ';
    const errorMsg = error.message?.toLowerCase() || '';
    
    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      userMessage = '⏸️ Quota exceeded! Free tier allows ~1 request/minute.';
    } else if (errorMsg.includes('404')) {
      userMessage = '❌ API not found. Check your API key source.';
    } else {
      userMessage += error.message;
    }
    throw new Error(userMessage);
  }
}

// ... Keep your existing translateImageText, askAIQuestion, and enrichAttractionWithContext functions here

/**
 * Translate text using Gemini
 * Detects text in the image and provides translations
 */
export async function translateImageText(
  imageData: string,
  targetLanguage: string = 'English'
): Promise<TranslationResult> {
  if (!genAI) {
    throw new Error(
      'Gemini API is not initialized. Please set VITE_GEMINI_API_KEY in your environment.'
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const base64Data = imageData.split(',')[1] || imageData;
    const mimeType = imageData.includes('png') ? 'image/png' : 'image/jpeg';

    const prompt = `Extract any visible text from this image and translate it to ${targetLanguage}.

If there is no text in the image, set originalText to "No text found" and translatedText to "No text found".

Respond with ONLY a JSON object in this format:
{
  "originalText": "The text you found in the original language",
  "translatedText": "The translated text in ${targetLanguage}",
  "sourceLanguage": "The detected original language",
  "targetLanguage": "${targetLanguage}"
}`;

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType as
            | 'image/jpeg'
            | 'image/png'
            | 'image/gif'
            | 'image/webp',
        },
      },
      prompt,
    ]);

    const responseText =
      response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }

    const result = JSON.parse(jsonMatch[0]) as TranslationResult;
    return result;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
}

/**
 * Ask the AI a follow-up question about a previously analyzed image
 * Context-aware conversation based on the image and location
 */
export async function askAIQuestion(
  question: string,
  imageData: string,
  currentExplanation: AIExplanationResult,
  location?: string
): Promise<string> {
  if (!genAI) {
    throw new Error(
      'Gemini API is not initialized. Please set VITE_GEMINI_API_KEY in your environment.'
    );
  }

  try {
    console.log('🔄 Processing follow-up question...');
    
    // Try primary model first
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      console.log('✅ Using gemini-2.0-flash for question');
    } catch (e) {
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Using gemini-1.5-flash for question');
      } catch (e2) {
        model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
        console.log('✅ Using gemini-pro-vision for question');
      }
    }

    const base64Data = imageData.split(',')[1] || imageData;
    const mimeType = imageData.includes('png') ? 'image/png' : 'image/jpeg';

    const contextInfo = `
The user previously received this AI explanation about the image:
- Title: ${currentExplanation.title}
- Category: ${currentExplanation.category}
- Description: ${currentExplanation.description}
${currentExplanation.culturalNote ? `- Cultural Note: ${currentExplanation.culturalNote}` : ''}
${location ? `- Current Location: ${location}` : ''}

The user is now asking: "${question}"

Please provide a helpful, context-aware answer. Keep it concise (2-3 sentences) and practical for a traveler.`;

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType as
            | 'image/jpeg'
            | 'image/png'
            | 'image/gif'
            | 'image/webp',
        },
      },
      contextInfo,
    ]);

    const answer =
      response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('✅ Received answer for question');
    return answer;
  } catch (error) {
    console.error('❌ Error asking AI question:', error);
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        console.error('🔴 API Error 404: Check your API key');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('🔴 Authentication Error: Get a new API key from https://aistudio.google.com/app/apikey');
      }
    }
    throw error;
  }
}

/**
 * Get nearby attractions enriched with cultural context using Gemini
 * Pass place names from Google Places API to be enriched with cultural insights
 */
export async function enrichAttractionWithContext(
  placeName: string,
  placeCategory: string
): Promise<{
  whyVisit: string;
  culturalEtiquette: string;
}> {
  if (!genAI) {
    throw new Error(
      'Gemini API is not initialized. Please set VITE_GEMINI_API_KEY in your environment.'
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `The user is interested in visiting: "${placeName}" (Category: ${placeCategory}).

Provide ONLY a JSON response with these exact keys:
{
  "whyVisit": "One compelling reason why a traveler should visit this place (1 sentence)",
  "culturalEtiquette": "One critical cultural etiquette tip or safety warning specific to this location (1 sentence, e.g., 'Remove shoes before entering' or 'Photography is prohibited')"
}

If you don't have specific information, provide general travel advice for this category of place.`;

    const response = await model.generateContent(prompt);

    const responseText =
      response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error enriching attraction:', error);
    throw error;
  }
}

/**
 * Extract text from image using Gemini Vision
 * Used to identify text in images for translation
 */
export async function extractTextFromImage(imageData: string): Promise<string> {
  if (!genAI) {
    throw new Error(
      'Gemini API is not initialized. Please set VITE_GEMINI_API_KEY in your environment.'
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const base64Data = imageData.split(',')[1] || imageData;
    const mimeType = imageData.includes('png') ? 'image/png' : 'image/jpeg';

    const prompt =
      'Extract all visible text from this image exactly as it appears. If there is no text, respond with "No text found".';

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType as
            | 'image/jpeg'
            | 'image/png'
            | 'image/gif'
            | 'image/webp',
        },
      },
      prompt,
    ]);

    const text =
      response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}
