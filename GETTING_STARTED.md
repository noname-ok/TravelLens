# 🚀 TravelLens AI Features - Getting Started Checklist

## ✅ Pre-Implementation Verification

Before you start, verify that the implementation was completed correctly:

### Step 1: Verify Files Were Created
- [ ] `src/app/services/geminiService.ts` exists
- [ ] `src/app/components/TranslateModal.tsx` exists
- [ ] `src/app/components/AIChatSheet.tsx` exists
- [ ] `.env.example` exists in root directory

### Step 2: Verify Files Were Updated
- [ ] `src/app/App.tsx` imports geminiService
- [ ] `src/app/components/AIExplanationScreen.tsx` imports TranslateModal and AIChatSheet
- [ ] `package.json` contains `@google/generative-ai` dependency

### Step 3: Check Package Installation
```bash
npm list @google/generative-ai
```
Should show: `@google/generative-ai@xxx`

---

## 🔑 Step 1: Get Your API Key (5 minutes)

### Option A: Free Tier (Recommended for Development)

1. **Visit Google AI Studio:**
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account (create one if needed, it's free)

2. **Create API Key:**
   - Click **"Create API Key"** button
   - Select **"Create API Key in new project"**
   - Google will generate a free API key automatically

3. **Copy the Key:**
   - Look for a key that starts with `AIza...`
   - Click the copy icon next to it
   - Save it somewhere safe (you'll need it next)

4. **Verify Your Key Works:**
   - Free tier includes 60 requests per minute
   - Perfect for testing and development
   - No credit card required

### Option B: Paid Tier (For Production)

1. Go to: https://cloud.google.com/generative-ai/docs/billing
2. Enable billing on your Google Cloud project
3. Follow paid tier setup instructions

---

## ⚙️ Step 2: Configure Environment Variables (3 minutes)

### Create `.env.local` File

1. **Open your project root directory:**
   - You should see `vite.config.ts`, `package.json`, `src/` folder

2. **Create a new file named `.env.local`:**
   - **Windows/Mac/Linux**: Right-click → New File → name it `.env.local`
   - **Alternatively**: Command line:
     ```bash
     # Windows (PowerShell)
     New-Item -Path ".env.local" -ItemType File
     
     # Mac/Linux
     touch .env.local
     ```

3. **Open `.env.local` in your editor** and paste:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Replace `your_api_key_here` with your actual API key** from Step 1
   - Example: `VITE_GEMINI_API_KEY=AIzaSyDxxx...`

5. **Save the file** (Ctrl+S or Cmd+S)

### Verify Environment Setup

```bash
# Check that file exists
ls -la .env.local

# The file should show (do NOT skip this step)
# -rw-r--r--  .env.local
```

---

## 🏃 Step 3: Start Development Server (2 minutes)

### Option A: If Not Already Running

```bash
cd c:\Users\phuax\Documents\VSC\TravelLens
npm run dev
```

### Option B: If Already Running

- Restart the dev server to pick up environment variables:
  - Stop: Press `Ctrl+C` in terminal
  - Start: Run `npm run dev` again

### Verify Server Started

You should see output like:
```
  VITE v6.3.5  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## 🧪 Step 4: Test Each Feature

### Feature 1: Test Image Explanation ✅

**Steps:**
1. Open http://localhost:5173/ in browser
2. Click **"📸 Take Photo"** button
3. Click **"Take Photo"** or **"Upload from Gallery"**
4. Select any image (landscape, building, food, etc.)
5. Click **"✓ Confirm"**

**Expected Result:**
- 🔄 Loading screen for 2-3 seconds
- 📄 Explanation screen with:
  - Image preview
  - Title (what it is)
  - Category badge
  - Description (why it matters)
  - 💡 Fun Fact section
  - Buttons for "Translate" and "Ask AI"
  - ⚠️ Cultural Note (if applicable)

**If it works:** ✅ Feature 1 is working!

**If it fails:**
- Check browser console (F12) for errors
- Verify `.env.local` has correct API key
- Check internet connection
- Verify API key is valid (visit aistudio.google.com/app/apikey)

---

### Feature 2: Test Translation 🌐

**Steps:**
1. From the explanation screen, click **"Translate"** button
2. Select a language from dropdown (try French, Japanese, Spanish)
3. Click **"Translate"** button

**Expected Result:**
- 🔄 Loading spinner for 1-2 seconds
- 📋 Translation results showing:
  - Language detected (e.g., "English → French")
  - Original text (if image has text)
  - Translated text
  - **"Copy Translation"** button

**If it works:** ✅ Feature 2 is working!

**If it shows "No text found":**
- That's expected! Use an image with visible text (menu, sign, poster)
- Try taking a photo of text and use "Translate Again" button

**If text appears but translation doesn't:**
- Check console for errors
- Verify API key is still valid
- Check if you hit the 60 req/min rate limit (try again in 1 minute)

---

### Feature 3: Test ChatBot 💬

**Steps:**
1. From the explanation screen, click **"Ask AI"** button
2. A bottom sheet should slide up with chat interface
3. Try asking questions:
   - "Is this place free to visit?" 
   - "What time should I go?"
   - "What should I know about this place?"
4. Read the AI response

**Expected Result:**
- 💬 Chat interface with:
  - Your question in blue bubble
  - AI response in gray bubble
  - Timestamps
  - Suggested questions (if first message)
  - Input field for follow-up questions

**Voice Input (Optional):**
- Click 🎤 microphone button
- Speak your question
- See it appear in input field
- Send as normal

**If it works:** ✅ Feature 3 is working!

**If it shows error:**
- Check console for details
- Verify API key is valid
- Ensure you're not exceeding rate limit
- Try restarting dev server

---

## 🎯 Step 5: Complete Feature Testing

Create a test plan by trying different image types:

### Test Matrix

| Image Type | Expected | Result | Notes |
|------------|----------|--------|-------|
| **Building/Architecture** | ✅ Explanation | ✅ | Good for testing |
| **Food/Menu** | ✅ Explanation + Translation | ✅ | Try with foreign menu |
| **Signboard/Text** | ✅ Translation | ✅ | Good for translation |
| **Landmark** | ✅ Explanation + Cultural note | ✅ | Will have warnings |
| **Street/Scene** | ✅ Explanation | ✅ | Generic but working |

### Sample Test Images

Try these types of images:
1. **Architecture**: Temple, historic building, modern structure
2. **Food**: Meal, restaurant menu, street food
3. **Signs**: Store sign, menu board, street sign
4. **Landmarks**: Famous location, monument, statue
5. **Nature**: Landscape, botanical garden, scenic view

---

## 🐛 Step 6: Troubleshooting

### Issue 1: "VITE_GEMINI_API_KEY is not set" warning

**Diagnosis:**
- `.env.local` file missing or incorrectly named
- File not in project root directory
- Dev server not restarted after creating file

**Solution:**
```bash
# 1. Verify file exists
ls -la .env.local

# 2. Check file contents
cat .env.local

# 3. Ensure it's in root (same level as package.json, vite.config.ts)

# 4. Restart dev server
npm run dev
```

---

### Issue 2: "TIMEOUT" or "Network Error"

**Diagnosis:**
- API key invalid
- Network connection issue
- Server unreachable
- Rate limit exceeded (60 req/min)

**Solution:**
```bash
# 1. Verify API key is valid
#    - Go to https://aistudio.google.com/app/apikey
#    - Check that the key you copied is correct
#    - No extra spaces or characters

# 2. Check internet connection
#    - Open a website to verify connectivity

# 3. Check if rate limit hit
#    - Wait 1 minute and try again
#    - Free tier: 60 requests per minute

# 4. Check console logs (F12 in browser)
#    - Look for detailed error messages
```

---

### Issue 3: "Unable to get explanation" or API errors

**Diagnosis:**
- API key invalid or expired
- Image format not supported
- API quota exceeded
- Gemini API rate limited

**Solution:**
1. **Verify API key is correct:**
   - Copy fresh key from: https://aistudio.google.com/app/apikey
   - Update `.env.local`
   - Restart dev server

2. **Check image format:**
   - Use JPG or PNG
   - Keep file size under 2MB
   - Ensure image is valid

3. **Check API limits:**
   - Free tier: 60 requests per minute
   - If you hit limit, wait 1 minute
   - Monitor use at: https://console.cloud.google.com/ (if using paid)

---

### Issue 4: Translation shows "No text found"

**This is normal!** Solutions:
- Use image with clear, readable text
- Try a menu, sign, or document
- Ensure text is in focus/not blurry
- Text in unusual fonts may not be detected

---

### Issue 5: Voice input not working

**Diagnosis:**
- Browser doesn't support Web Speech API (older browser)
- Microphone permission not granted
- No microphone device
- Using non-HTTPS (voice only works on HTTPS in production)

**Solution:**
- Use modern browser: Chrome, Edge, Safari (latest)
- Grant microphone permission when prompted
- Try typing instead of voice input
- For production, use HTTPS

---

## ✨ Step 7: Celebrate! 🎉

If all three features work, you're done! 

Your TravelLens app now has:
- ✅ AI Image Explanation (Gemini Vision API)
- ✅ Text Translation (14+ languages)
- ✅ Chatbot Assistant (voice + text)

---

## 📚 Next Steps After Getting Everything Working

### Week 1: Explore & Customize
- [ ] Try different images and languages
- [ ] Adjust system prompts in `geminiService.ts`
- [ ] Customize UI theme/colors
- [ ] Add more languages to TranslateModal

### Week 2: Enhance Features
- [ ] Add caching for repeated images
- [ ] Optimize image compression
- [ ] Improve error messages
- [ ] Add analytics/logging

### Month 1: Scale Up
- [ ] Add Firebase for cloud storage
- [ ] Integrate Google Places API
- [ ] Add user authentication
- [ ] Implement offline caching

### Future: Production Ready
- [ ] Backend API gateway
- [ ] Advanced security
- [ ] Rate limiting per user
- [ ] Multi-language UI

---

## 🆘 Getting Help

If you encounter issues:

1. **Check the Documentation:**
   - `QUICK_START.md` - Quick reference
   - `SETUP_AI_FEATURES.md` - Detailed setup
   - `ARCHITECTURE.md` - Technical details
   - `IMPLEMENTATION_SUMMARY.md` - Overview

2. **Check Console Errors:**
   - Open browser dev tools: F12
   - Look at Console tab for error messages
   - Copy error message for searching

3. **Common Resources:**
   - Google Gemini API: https://ai.google.dev/
   - Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
   - Vite Config: https://vitejs.dev/

4. **Re-check Setup:**
   - Is `.env.local` in project root?
   - Does it have `VITE_GEMINI_API_KEY=...`?
   - Is dev server restarted?
   - Is API key valid (not expired)?

---

## 📊 Performance Expectations

| Action | Expected Time | Can User Wait? |
|--------|---|---|
| Image upload | < 1 sec | Yes |
| AI analysis | 1-3 sec | Yes |
| Translation | 1-2 sec | Yes |
| Chat response | 1-3 sec | Yes |
| Voice input | 2-5 sec | Yes |

All operations should feel responsive and not frustrate users.

---

## 🔒 Security Reminder

✅ **Safe to use:**
- Free tier is safe for development
- Your API key is private (in `.env.local`)
- Images are not stored permanently
- All communication is encrypted (HTTPS)

⚠️ **Keep secure:**
- Never commit `.env.local` to git
- Never share your API key
- Use environment variables in production
- Monitor API usage in Google Cloud Console

---

## ✅ Final Checklist

Before you consider yourself "done":

- [ ] API key obtained from Google
- [ ] `.env.local` file created in root
- [ ] `VITE_GEMINI_API_KEY` set correctly
- [ ] Dev server restarted
- [ ] Image Explanation feature tested ✅
- [ ] Translation feature tested ✅
- [ ] Chatbot feature tested ✅
- [ ] All error messages understood
- [ ] Documentation read
- [ ] Ready to customize/extend!

---

## 🎊 You're All Set!

Your TravelLens app is now powered by Google Gemini AI. Users can:

🌍 **Understand places instantly**
📸 Capture any image
💡 Get instant AI-powered explanations
🌐 Translate text in 14+ languages  
💬 Ask context-aware questions with voice support

**Happy travels! 🚀✈️**

---

**Questions?** Check SETUP_AI_FEATURES.md or ARCHITECTURE.md

**Ready to customize?** Edit `src/app/services/geminiService.ts` to change prompts

**Want to deploy?** See production deployment guide in documentation

---

**Last Updated:** February 2026  
**Status:** ✅ Complete and Ready to Use  
**Support:** See documentation files for detailed help

