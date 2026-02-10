import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    'VITE_GEMINI_API_KEY is not set. AI features will not work. Please add it to your .env file.'
  );
}

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

/**
 * Get AI explanation for an image using Gemini Vision
 * This function analyzes an image and provides:
 * - What it is
 * - Why it matters
 * - Cultural/historical context
 * - Interesting facts
 */
export async function getImageExplanation(
  imageData: string
): Promise<AIExplanationResult> {
  if (!genAI) {
    throw new Error(
      'Gemini API is not initialized. Please set VITE_GEMINI_API_KEY in your environment.'
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert base64 to image data
    const base64Data = imageData.split(',')[1] || imageData;
    const mimeType = imageData.includes('png') ? 'image/png' : 'image/jpeg';

    const prompt = `You are a knowledgeable travel guide assistant helping travelers understand places and objects.

Analyze this image carefully and provide:
1. **What is it?** - A brief, clear identification of what's in the image
2. **Why does it matter?** - Historical, cultural, or practical significance
3. **Category** - Classify it (e.g., Architecture, Food, Nature, Historical, Modern Architecture, Arts & Crafts)
4. **Cultural Note** - If relevant, provide important cultural etiquette or warnings (e.g., "Remove shoes before entering", "Photography restricted")
5. **Interesting Fact** - One fascinating or lesser-known fact about this object/place

Format your response as JSON with these exact keys:
{
  "title": "Name/identification",
  "description": "Combined explanation of what it is and why it matters",
  "category": "Category name",
  "culturalNote": "Cultural etiquette or warning (if applicable, otherwise omit)",
  "interestingFact": "One interesting fact"
}

Keep descriptions concise but informative (2-3 sentences max). Make it engaging for travelers.`;

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

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }

    const result = JSON.parse(jsonMatch[0]) as AIExplanationResult;
    return result;
  } catch (error) {
    console.error('Error getting image explanation:', error);
    throw error;
  }
}

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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
    return answer;
  } catch (error) {
    console.error('Error asking AI question:', error);
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
