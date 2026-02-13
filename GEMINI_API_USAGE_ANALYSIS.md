# Google Gemini API Usage Analysis

## Summary
Your TravelLens app has **rate limiting in place** that restricts API calls to **~1 request per minute** for the free tier. Here's the detailed breakdown:

---

## 📊 Rate Limiting Configuration

### Current Settings (in `geminiService.ts`)
```typescript
const rateLimiter = {
  lastRequestTime: 0,
  minDelayMs: 5000,          // 5 second minimum between requests
  requestCount: 0,
  resetTime: Date.now() + 60000,  // 1 minute reset window
  
  canMakeRequest(): boolean {
    // Resets count every 60 seconds
    // Allows max 1 request per minute (requestCount >= 1 returns false)
    // Additionally enforces 5 second minimum spacing between requests
  }
};
```

**Key Constraints:**
- ✅ **Max 1 API call per 60-second window**
- ✅ **Minimum 5 seconds between each request**
- ✅ Rate limit resets every minute

---

## 🔍 All API Call Points (5 total)

### 1. **AILensScreen.tsx** - Image Explanation (Line 170)
```typescript
const result = await getImageExplanation(imageData);
```
**Function:** Analyzes a captured image and returns explanation with title, category, and cultural notes
- **Frequency:** 1 call per image capture
- **Endpoint:** Gemini 2.0 Flash or 1.5 Flash
- **Rate Limited:** ✅ YES

### 2. **AILensScreen.tsx** - Ask Question (Line 339)
```typescript
const response = await askAIQuestion(question, image, explanation);
```
**Function:** Answers follow-up questions about the analyzed image
- **Frequency:** 1 call per question asked
- **Endpoint:** Gemini 2.0 Flash or 1.5 Flash
- **Rate Limited:** ✅ YES

### 3. **AILensScreen.tsx** - Another Ask Question (Line 473)
```typescript
const aiResponse = await askAIQuestion(question, imageData, explanation);
```
**Function:** Same as #2 (likely duplicate trigger point)
- **Frequency:** 1 call per question
- **Endpoint:** Gemini 2.0 Flash or 1.5 Flash
- **Rate Limited:** ✅ YES

### 4. **AIChatSheet.tsx** - Chat Interaction (Line 121)
```typescript
const answer = await askAIQuestion(
  input, 
  imageData,      // Base64 from camera
  explanation,    // Initial analysis 
  location        // Optional GPS
);
```
**Function:** Context-aware chat responses
- **Frequency:** 1 call per message sent
- **Endpoint:** Gemini 2.0 Flash or 1.5 Flash
- **Rate Limited:** ✅ YES

### 5. **TranslateModal.tsx** - Text Translation (Line 57)
```typescript
const result = await translateImageText(imageData, targetLanguage);
```
**Function:** Extracts and translates visible text in images
- **Frequency:** 1 call per translation request
- **Endpoint:** Gemini 1.5 Flash (no fallback)
- **Rate Limited:** ✅ YES

---

## 📈 Usage Patterns - Per Minute

### Typical User Session Flow:
```
Minute 1:
  [0s]   User takes photo → getImageExplanation() ✅ (1st request)
  [5s+]  Rate limiter blocks before 60s is up
         ↓
Minute 2:
  [60s]  Rate counter resets
  [61s]  User can ask next question → askAIQuestion() ✅ (2nd request)
```

### Actual Per-Minute Calls:
- **Maximum: 1 API call every 60 seconds**
- **Realistic user behavior: 0-1 calls per minute** (depends on user interaction)
  - User takes photo + immediately asks question = 2 calls (but 2nd waits 5+ sec = still within 1-min limit)
  - User translates text = 1 additional call (if within window)

---

## ⚠️ Current Rate Limit Behavior

### What Happens If User Exceeds Limit:
```typescript
if (this.requestCount >= 1) return false;
if (now - this.lastRequestTime < this.minDelayMs) return false;

// Error thrown:
throw new Error('⏸️ Rate limit hit! Free tier allows ~1 request per minute.');
```

### When Does It Reset?
- **Automatic reset:** Every 60 seconds (`resetTime = now + 60000`)
- **Per 5-second gaps:** Additional safeguard between consecutive calls

---

## 🎯 Recommended Adjustments (If Needed)

### Option 1: Current Setup (Recommended for Free Tier)
- Keep 1 request/minute limit
- Suitable for: Casual users taking photos

### Option 2: Upgrade to Standard Tier (If buying credits)
Modify rate limiter:
```typescript
const rateLimiter = {
  minDelayMs: 1000,      // 1 second between requests
  // Can make up to 15 requests per minute (Free Tier: 10, Paid: 15+)
  requestCount: 0,
  resetTime: Date.now() + 60000,
};
```

### Option 3: Paid Tier Configuration
```typescript
const rateLimiter = {
  minDelayMs: 500,       // 0.5 seconds between
  requestCount: 0,
  maxRequestsPerMinute: 60,  // Adjust per your quota
  resetTime: Date.now() + 60000,
};
```

---

## 📋 API Functions Summary

| Function | Calls/Min | Model Used | Rate Limited |
|----------|-----------|-----------|--------------|
| `getImageExplanation()` | ~1 | gemini-2.0-flash | ✅ Yes |
| `translateImageText()` | ~1 | gemini-1.5-flash | ✅ Yes |
| `askAIQuestion()` | ~1 | gemini-2.0-flash | ✅ Yes |
| `enrichAttractionWithContext()` | Not used | gemini-1.5-flash | ❌ No*¹ |
| `extractTextFromImage()` | Not used | gemini-1.5-flash | ❌ No*² |

*¹ Not currently called in components  
*² Available but not integrated

---

## 🔐 Quota Management

### Google Gemini Free Tier Limits:
- **Requests per minute:** 10 (but your code limits to 1)
- **Requests per day:** 1500
- **Tokens per minute:** 32,000

### Your App's Limits:
- **Configured limit:** 1 request/minute
- **Practical impact:** Prevents abuse, encourages thoughtful usage
- **Daily potential:** ~1,440 requests (if 1 per minute, 24/7)

---

## ✅ Recommendations

1. **Current Setup:** ✅ Good for free tier (prevents quota exhaustion)
2. **User Experience:** Consider informing users about the 1-request/minute limit
3. **Error Handling:** Already implemented ("⏸️ Rate limit hit!")
4. **Monitoring:** Add analytics to track actual API usage per session

---

## 📌 Quick Reference

**How many times per minute?** → **1 API call maximum**
- Enforced by `canMakeRequest()` function
- Resets every 60 seconds
- Additional 5-second spacing between attempts

**To increase this:** Need to modify `rateLimiter` and upgrade your API tier
