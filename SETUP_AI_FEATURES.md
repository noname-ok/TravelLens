# TravelLens AI Features Setup Guide

This guide explains how to set up the three AI-powered features in your TravelLens app.

## Features Overview

### 1. 📸 Photo → AI Explanation (Gemini Vision)
- **What it does**: Uses Google's Gemini Vision API to analyze images and provide intelligent explanations
- **Included information**: 
  - What the object/place is
  - Why it matters (historical/cultural significance)
  - Category classification
  - Cultural etiquette warnings
  - Interesting facts

### 2. 🌐 Google Translator (In-App)
- **What it does**: Extracts and translates text from images
- **Supported languages**: 14+ languages including Spanish, French, German, Japanese, Chinese, Arabic, Hindi, Thai, Vietnamese, etc.
- **Use cases**: 
  - Menu translations
  - Signboard translations
  - Notice translations

### 3. 💬 AI Chatbot (Ask About the Place)
- **What it does**: Allows follow-up questions about the analyzed image
- **Features**:
  - Context-aware responses based on the image and previous explanation
  - Voice input support (microphone)
  - Suggested questions for quick access
  - Real-time chat interface
- **Example questions**:
  - "Is this place free to enter?"
  - "What should I be careful of here?"
  - "Best time to visit?"
  - "How do I get here?"
  - "Are there any entrance fees?"

---

## Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- A Google account

---

## Setup Instructions

### Step 1: Get Your Google Gemini API Key

1. **Go to Google AI Studio**:
   - Visit: https://aistudio.google.com/app/apikey

2. **Create an API Key**:
   - Click "Create API Key in new project"
   - Google will create a free API key for you (no payment required for free tier)
   - Copy the API key

3. **Check Usage Limits**:
   - Free tier includes: 60 requests per minute
   - Perfect for development and personal use
   - For production, consider upgrading to paid tier

### Step 2: Configure Environment Variables

1. **Create `.env.local` file** in the project root:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`**:
   ```
   VITE_GEMINI_API_KEY=paste_your_api_key_here
   ```

3. **Save the file**

### Step 3: Install Dependencies

If not already installed, the Google Generative AI SDK should be in your packages:

```bash
npm install @google/generative-ai
```

### Step 4: Test the Features

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the features**:
   - **Photo Explanation**: Click "Take Photo" → Upload/capture an image → See AI explanation
   - **Translate**: On the explanation screen → Click "Translate" button → Select language → Get translation
   - **Ask AI**: On the explanation screen → Click "Ask AI" button → Type a question → Get context-aware answer

---

## Component Architecture

### New Files Created:

1. **`src/app/services/geminiService.ts`**
   - Core API integration with Gemini
   - Exports functions:
     - `getImageExplanation()` - Analyze images
     - `translateImageText()` - Translate text in images
     - `askAIQuestion()` - Context-aware chatbot
     - `enrichAttractionWithContext()` - Enrich places with cultural insights
     - `extractTextFromImage()` - Extract visible text

2. **`src/app/components/TranslateModal.tsx`**
   - Modal dialog for translation interface
   - Language selection (14+ languages)
   - Copy-to-clipboard functionality
   - Error handling and empty state management

3. **`src/app/components/AIChatSheet.tsx`**
   - Bottom sheet UI for chatbot
   - Real-time message chat interface
   - Voice input support (Web Speech API)
   - Suggested questions carousel
   - Auto-scroll to latest messages

4. **Updated `src/app/components/AIExplanationScreen.tsx`**
   - Integrated Translate and Ask AI buttons
   - Display "Fun Fact" section
   - Better styling for cultural notes
   - Proper error handling

---

## API Integration Details

### Gemini 1.5 Flash Model Used

- **Model**: `gemini-1.5-flash`
- **Why this model**: 
  - Fast response times (< 2 seconds)
  - Optimized for vision tasks
  - Cost-effective for high-volume requests
  - Excellent for real-time mobile app use

### Request Flow:

```
User takes photo
    ↓
Convert image to base64
    ↓
Send to Gemini Vision API with system prompt
    ↓
Parse JSON response
    ↓
Display formatted explanation, facts, cultural notes
    ↓
User can translate text or ask follow-up questions
```

---

## Features in Detail

### Photo Explanation System Prompt

```
"You are a helpful travel guide for a first-time traveller. 
Analyze this image. If it is text, translate the key parts. 
If it is a machine or interface, explain step-by-step how to use it. 
Keep it simple."
```

### Translation System Prompt

```
"Extract any visible text from this image and translate it to [TARGET_LANGUAGE].
If there is no text in the image, set originalText to 'No text found' 
and translatedText to 'No text found'."
```

### Chatbot System Prompt

```
"The user is interested in visiting: [PLACE_NAME]. 
The user is asking: [QUESTION].

Context from previous explanation: [EXPLANATION_DATA].

Provide a helpful, context-aware answer. Keep it concise (2-3 sentences) 
and practical for a traveler."
```

---

## Usage Examples

### Example 1: Explaining a Temple
1. **Photo**: Temple with ornate architecture
2. **Explanation returned**:
   - **Title**: "Historic Buddhist Temple"
   - **Description**: "15th-century temple featuring traditional architectural elements..."
   - **Category**: "Architecture"
   - **Cultural Note**: "Remove shoes before entering. Photography prohibited in inner sanctum."
   - **Fun Fact**: "The roof design represents Buddhist cosmology..."

### Example 2: Translating a Menu
1. **Photo**: Menu with foreign text
2. **Action**: Click "Translate" → Select language
3. **Result**: 
   - **Original**: "鶏のから揚げ"
   - **Translation**: "Fried Chicken"

### Example 3: Asking Follow-up Question
1. **Previous**: Looking at a temple
2. **Question**: "Is photography allowed inside?"
3. **Answer**: "Photography is prohibited in the main sanctuary and during prayer times, but you can take photos in the outer courtyards and gardens."

---

## Error Handling

The app includes comprehensive error handling:

- ✅ Missing API key → Shows warning message in console
- ✅ Network errors → Toast notification with retry option
- ✅ Invalid image format → Error message
- ✅ No text to translate → Shows "No text found" message
- ✅ API quota exceeded → Friendly error message with guidance

---

## Troubleshooting

### "VITE_GEMINI_API_KEY is not set" Warning

**Solution**: 
1. Verify `.env.local` file exists in project root
2. Check API key is copied correctly (no extra spaces)
3. Restart dev server: `npm run dev`

### Translation returns "No text found"

**Causes**:
- Image has no visible text
- Text is too blurry or small
- Text in unusual fonts

**Solution**: Try with clearer images with readable text

### Chatbot not responding

**Possible causes**:
- API quota exceeded (60 req/min limit for free tier)
- Network connection issue
- Invalid API key

**Solution**: 
- Wait a few minutes if quota exceeded
- Check internet connection
- Verify API key in console

### Voice input not working

**Causes**:
- Browser doesn't support Web Speech API (older browsers)
- Microphone not permitted
- Not using HTTPS (required for Web Speech API)

**Solution**:
- Use Chrome, Edge, or Safari (latest versions)
- Grant microphone permission when prompted
- Use HTTPS in production

---

## Performance Optimization Tips

1. **Image Compression**: Large images may take longer to process
   - Recommendation: Keep images under 2MB
   - JPEG format is recommended

2. **API Rate Limiting**: 
   - Free tier: 60 requests per minute
   - If you hit the limit, requests will fail temporarily
   - Retry after a few seconds

3. **Caching Responses** (Optional future enhancement):
   - Cache explanations for identical images
   - Reduces API calls and latency

---

## Safety & Privacy

- ✅ Images are sent directly to Google's servers (encrypted HTTPS)
- ✅ No images are stored in your app's local storage
- ✅ No local database of images or explanations
- ✅ API key should not be exposed in client-side code (managed by Vite environment variables)
- ⚠️ Keep your API key secret - don't commit `.env.local` to git

### Recommended .gitignore Setup:

```
.env.local
.env*.local
```

---

## Future Enhancements

### Phase 2 Potential Features:
1. **Integration with Google Places API**
   - Real-time nearby attractions with cultural context
   - Navigation integration

2. **Firebase Cloud Storage**
   - Save travel journal entries to cloud
   - Sync across devices
   - Share journal entries with friends

3. **Personalization**
   - User preferences for languages
   - Travel history and interests
   - Bookmarked places and explanations

4. **Offline Mode**
   - Cache previous explanations
   - Download language packs
   - Work without internet

---

## Support & Resources

- **Google Gemini API Documentation**: https://ai.google.dev/
- **Gemini Capabilities**: https://ai.google.dev/models/gemini
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **TravelLens GitHub**: [Your repo URL]

---

## License & Attribution

- Google Generative AI SDK: Apache 2.0
- This implementation: [Your license]

---

**Happy travels! 🌍✈️**
