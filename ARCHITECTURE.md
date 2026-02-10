# TravelLens AI Features - Architecture Guide

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TravelLens Mobile App                         │
│                    (React 18 + Vite)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼──┐  ┌───▼────┐  ┌─▼───────┐
            │ Camera   │  │  AI    │  │ Nearby  │
            │ Screen   │  │Explana-│  │Attractions│
            │          │  │tion    │  │ Screen  │
            └───────┬──┘  └───┬────┘  └─┬───────┘
                    │         │         │
                    │    ┌────▼────┐    │
                    │    │ AIExpl- │    │
                    │    │ anation  │    │
                    │    │ Screen   │    │
                    │    └────┬─────┘    │
                    │         │          │
           ┌────────┼─────────┼──────────┼────────┐
           │        │         │          │        │
      ┌────▼──┐ ┌───▼───┐ ┌───▼────┐ ┌─▼──┐ ┌──▼──┐
      │Image  │ │Translate    │ Ask   │ │Map │ │Jour-│
      │Upload │ │Modal    │ │AI Chat │ │View│ │nal  │
      └────┬──┘ └───┬───┘ └───┬────┘ └─┬──┘ └──┬──┘
           │        │         │        │       │
           └────────┼─────────┼────────┼───────┘
                    │         │        │
                    │    ┌────▼────────▼─────┐
                    │    │   Gemini Service  │
                    │    │   (Core API Lib)  │
                    │    └────┬────────┬─────┘
                    │         │        │
           ┌────────┘         │        │
           │            ┌─────▼──────▼────┐
           │            │  Google Gemini  │
           │            │  API (Cloud)    │
           │            │                 │
           │            │ - Vision Models │
           │            │ - Text Models   │
           │            └─────────────────┘
           │
      (Future)
      Firebase Storage
      Google Places API
```

---

## 🔌 Integrated Features Flow

### Complete User Journey

```
┌──────────────────────────────────────────────────────────────┐
│                    User Opens App                             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │ Home     │
                    │ Screen   │
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐ ┌────────▼──────┐  ┌────▼────┐
    │ Take    │ │ View Map     │  │ View    │
    │ Photo   │ │              │  │ Journal │
    └────┬────┘ └─────────────┘  └────────┘
         │
    ┌────▼──────────────────────┐
    │ Camera Screen             │
    │ (Capture/Upload Image)    │
    └────┬─────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ Processing Screen         │
    │ (Loading animation)       │
    └────┬─────────────────────┘
         │
    ┌────▼──────────────────────────────┐
    │ AI Processing Happens Here:       │
    │ getImageExplanation()             │
    │ ↓                                 │
    │ Sends image to Gemini Vision API │
    │ ↓                                 │
    │ Returns: {title, description,    │
    │  category, culturalNote, fact}   │
    └────┬──────────────────────────────┘
         │
    ┌────▼────────────────────────────┐
    │ AI Explanation Screen            │
    │ ┌──────────────────────────────┐ │
    │ │ Image Preview                │ │
    │ │                              │ │
    │ ├──────────────────────────────┤ │
    │ │ Title                        │ │
    │ │ Category Badge               │ │
    │ │                              │ │
    │ │ Description                  │ │
    │ │                              │ │
    │ │ 💡 Fun Fact Section          │ │
    │ │                              │ │
    │ │ [Translate] [Ask AI] Buttons │ │
    │ │                              │ │
    │ │ ⚠️ Cultural Note (if any)    │ │
    │ │                              │ │
    │ │ → Nearby Attractions CTA     │ │
    │ └──────────────────────────────┘ │
    └────┬──────────────────────────────┘
         │
    ┌────┴─────────────────────────────┐
    │         BRANCHING PATHS           │
    │                                   │
 ┌──▼────────┐  ┌────────────────┐     │
 │ Click     │  │ Click          │     │
 │Translate  │  │ Ask AI         │     │
 └──┬────────┘  └────┬───────────┘     │
    │                │                 │
┌───▼──────────┐  ┌──▼──────────────┐  │
│TranslateModal│  │ AIChatSheet     │  │
│              │  │                 │  │
│ - Language   │  │ - Chat messages │  │
│   dropdown   │  │ - Input field   │  │
│ - Translate  │  │ - Voice button  │  │
│   button     │  │ - Send button   │  │
│ - Original   │  │ - Suggested q's │  │
│   text       │  │                 │  │
│ - Translated │  └──┬──────────────┘  │
│   text       │     │                 │
│ - Copy btn   │     Continuous        │
│              │     conversation loop │
└──────────────┘     until closed      │
    │                │                 │
    └────────────────┼─────────────────┘
                     │
    ┌────────────────▼──────────────┐
    │ Save/Journal/Back to Home     │
    └───────────────────────────────┘
```

---

## 🔧 Component Dependency Tree

```
App.tsx (Main Router)
├── HomeScreen
├── CameraScreen
│   └── onCapture → App state update
├── AIProcessingScreen
├── AIExplanationScreen ⭐ (NEW FLOWS)
│   ├── TranslateModal 🆕
│   │   ├── Dialog (from ui)
│   │   ├── Select (from ui)
│   │   └── geminiService.translateImageText()
│   │
│   ├── AIChatSheet 🆕
│   │   ├── Sheet (from ui)
│   │   ├── Input (from ui)
│   │   └── geminiService.askAIQuestion()
│   │
│   └── Shows explanation, fun fact, cultural notes
│
├── NearbyAttractionsScreen
├── JournalPostScreen
├── MapViewScreen
├── JournalListScreen
└── ProfileScreen

Services Layer:
└── geminiService.ts 🆕
    ├── getImageExplanation()
    ├── translateImageText()
    ├── askAIQuestion()
    ├── extractTextFromImage()
    └── enrichAttractionWithContext()
```

---

## 📡 API Call Sequence Diagrams

### Sequence 1: Get Image Explanation

```
User Screen                App                     Gemini API
    │                       │                          │
    ├─ Take Photo ─────────→│                          │
    │                       │                          │
    │                       ├─ Convert to base64 ─────→│
    │                       │                          │
    │                  Show Loading ──────────────→   │
    │                       │    (Processing Screen)  │
    │                       │                    (Analyzing...)
    │                       │←──── JSON response ─────┤
    │                       │                          │
    │←──── Displayexplication ─────────────────────────│
    │                       │                          │
    ├─ Can now Translate ──→│                          │
    │                       ├─ New API call ─────────→│
    │  or Ask AI            │                    (Translation)
    │                       │←─── Translated text ────┤
    │                       │                          │
    │                       └─ Update UI              │
    │←────────────────────────────────────────────────┤
```

### Sequence 2: Translate Text

```
TranslateModal              App                 Gemini API
    │                       │                      │
    ├─ Click Translate ────→│                      │
    │ (lang selected)       │                      │
    │                       ├─ Image + language ──→│
    │<─ Loading spinner ────│                      │
    │                       │                 (Extracting text)
    │                       │                 (Translating)
    │                       │←─ {original,        │
    │                       │    translated}      │
    │                       │                      │
    │←───── Display results─────────────────────────│
    │                       │                      │
    ├─ Copy button ────────→│ (to clipboard)       │
    │                       │                      │
    └─ Close modal ────────→│ Back to main screen  │
```

### Sequence 3: Ask AI Question

```
User/Voice       AIChatSheet      App           Gemini API
   │                 │             │                 │
   ├─ Type/Speak ───→│             │                 │
   │                 ├─ Message ──→│                 │
   │                 │             ├─ Image + q ───→│
   │                 │< Loading... │                 │
   │                 │             │          (Context processing)
   │                 │             │←─ Answer string┤
   │                 │             │                 │
   │←─ Display msg ──┤←────────────┤                 │
   │  + assistant    │             │                 │
   │  response       │             │                 │
   │                 │             │                 │
   ├─ Follow up Q ──→│  (repeat)   │                 │
   │                 │             │                 │
   └─ Close sheet ──→│ Back to exp │                 │
                     │ screen      │                 │
```

---

## 🗂️ File Organization & Responsibilities

### Service Layer: `geminiService.ts`
**Responsibility**: Handle all Gemini API communication

```typescript
Core Functions:
├── getImageExplanation()      // Vision → text explanation
├── translateImageText()        // Vision + NLP → translation
├── askAIQuestion()            // Vision + NLP → conversation
├── extractTextFromImage()     // Vision → raw text
├── enrichAttractionWithContext() // NLP → place insights

Utilities:
├── Error handling
├── Type definitions
├── Prompt engineering
└── Response parsing (JSON)
```

### UI Layer: React Components

**AIExplanationScreen.tsx**
- Orchestrates the three features
- Manages modal/sheet states
- Passes image and explanation to sub-components

**TranslateModal.tsx**
- Language selection UI
- Calls `translateImageText()` service
- Displays and handles translation results
- Copy-to-clipboard functionality

**AIChatSheet.tsx**
- Chat message display
- Input field with voice support
- Calls `askAIQuestion()` service
- Maintains conversation state
- Renders suggested questions

---

## 🔌 Integration Points

### Where Features Connect

```
Photography Flow:
  CameraScreen → onCapture() → App state update
                                    ↓
                         Gemini API call (getImageExplanation)
                                    ↓
                         AIExplanationScreen rendered

Translation Feature:
  AIExplanationScreen → Translate button click
                                    ↓
                         TranslateModal opens
                                    ↓
                         User selects language
                                    ↓
                         translateImageText() called
                                    ↓
                         Results displayed

Chatbot Feature:
  AIExplanationScreen → Ask AI button click
                                    ↓
                         AIChatSheet opens
                                    ↓
                         User asks question
                                    ↓
                         askAIQuestion() called
                                    ↓
                         Response displayed
```

---

## 🔐 Data Flow & Security

```
User Image (Local)
    ↓
[SECURE] Base64 encoding
    ↓
[ENCRYPTED] HTTPS transmission
    ↓
Google Gemini API (Cloud)
    ↓
[PROCESSED] AI analysis
    ↓
[RETURNED] JSON response
    ↓
[LOCAL] Displayed in app (not stored)
    ↓
[OPTIONAL] Save to Firebase (if implemented)
    ↓
[CLEANUP] Original image cleared from state
```

**Security Notes:**
- Images never stored locally (except in state during session)
- HTTPS encryption in transit
- API key in environment variables (not exposed)
- No persistent backend for basic features
- User has full control over image deletion

---

## 📊 State Management

### App.tsx State Structure

```typescript
interface AppState {
  capturedImage: string | null;           // Base64 image data
  currentExplanation: AIExplanationResult | null;  // From Gemini
  attractions: Attraction[];               // Nearby places
  journalEntries: JournalEntry[];          // User's posts
}

State Updates:
- On capture: capturedImage set
- On explanation loaded: currentExplanation set
- On journal save: add to journalEntries
- On navigation: preserved across routes
```

### Local Component States

**TranslateModal:**
```typescript
- targetLanguage: string
- translation: TranslationResult | null
- isLoading: boolean
- copied: boolean
```

**AIChatSheet:**
```typescript
- messages: ChatMessage[]
- input: string
- isLoading: boolean
- isListening: boolean
```

---

## 🚀 Performance Optimizations

### Current Implementation
- Images processed on-demand (no caching)
- Async API calls to prevent UI blocking
- Loading states to show progress
- Lazy loading of components via React Router

### Potential Future Optimizations
1. **Response Caching**
   - Cache explanations for identical images
   - Reduce API calls by 20-30%

2. **Image Compression**
   - Compress large images before sending
   - Faster transmission, lower costs

3. **Prefetching**
   - Load attractions data while user reads explanation
   - Smoother experience

4. **Offline Support**
   - Cache recent explanations
   - Work without internet

---

## 🔄 Error Handling Architecture

```
Try/Catch Blocks at Service Level
    ↓
Error details logged to console
    ↓
User-friendly message via Toast
    ↓
Fallback UI state
    ↓
Optional retry mechanism
```

**Error Types Handled:**

```javascript
API_NOT_INITIALIZED    → "API key not set"
NETWORK_ERROR         → "Check internet connection"
RATE_LIMIT            → "Try again in a minute"
INVALID_IMAGE         → "Image format not supported"
NO_TEXT_FOUND         → "No text detected"
PARSING_ERROR         → "Unable to process response"
VOICE_NOT_SUPPORTED   → "Microphone not available"
```

---

## 🎨 UI State Transitions

### AIExplanationScreen States

```
IDLE
  ↓ (Image received)
LOADING → EXPLANATION_SHOWN
  ↓           ↓
  │      [Translate btn] → TRANSLATE_MODAL_OPEN
  │           ↓              ↓
  │      LOADING         TRANSLATE_SHOWN
  │           ↓              ↓
  │      [Result]        [Copy/Retry]
  │                           ↓
  │←─ [Close] ────────────────┘
  │
  ├─ [Ask AI] → CHAT_SHEET_OPEN
  │                ↓
  │           CHAT_ACTIVE
  │             (Loop)
  │                ↓
  │           [Close Sheet]
  │
  └─ [Back] → Navigate to home
```

---

## 🧪 Testing Strategy

### Unit Tests (Recommended)
- Test each Gemini service function independently
- Mock API responses
- Test error scenarios

### Integration Tests
- Test component + service together
- Test modal/sheet open/close flows
- Test state updates

### E2E Tests
- Complete user journey (photo → translate → ask)
- Voice input flow
- Error recovery

### Manual Testing Checklist
- [ ] Photo explanation with various image types
- [ ] Translation in all supported languages
- [ ] Chat conversation continuity
- [ ] Voice input (if supported browser)
- [ ] Error scenarios (no internet, quota exceeded)

---

## 📈 Scalability Considerations

### Current Limitations
- 60 requests/minute (free tier)
- Single-threaded processing
- No multi-user session management

### For Production Scale

1. **Backend API Gateway**
   - Proxy Gemini requests through your server
   - Add rate limiting per user
   - Log and monitor usage

2. **Caching Layer**
   - Redis for response caching
   - Reduce API calls by 50%+

3. **Database**
   - Firebase Firestore for journal storage
   - User preferences and history

4. **Analytics**
   - Track feature usage
   - Monitor API performance
   - User engagement metrics

---

## 🔗 Integration Checklist

- [x] Gemini API integrated
- [x] Image explanation working
- [x] Translation working
- [x] Chatbot working
- [x] Error handling implemented
- [x] Types defined
- [x] UI components created
- [x] Documentation complete
- [ ] Firebase added (future)
- [ ] Google Places API added (future)
- [ ] Analytics added (future)

---

## 📚 Quick Reference

| Feature | API Call | Component | Status |
|---------|----------|-----------|--------|
| Image Explanation | `getImageExplanation()` | AIExplanationScreen | ✅ Live |
| Text Translation | `translateImageText()` | TranslateModal | ✅ Live |
| Chatbot | `askAIQuestion()` | AIChatSheet | ✅ Live |
| Text Extraction | `extractTextFromImage()` | Service only | ✅ Available |
| Place Enrichment | `enrichAttractionWithContext()` | Future feature | 🔄 Ready |

---

**This architecture is designed for:**
- ✅ Modularity (services, components separate)
- ✅ Scalability (easy to add features)
- ✅ Maintainability (clear separation of concerns)
- ✅ Performance (async operations, proper loading states)
- ✅ UX (accessible, error-friendly, mobile-first)

**Happy building! 🚀**

