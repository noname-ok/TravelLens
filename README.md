# TravelLens - AI Travel Explainer & Smart Cultural Guide

**Understand Places Instantly — Travel Smarter, Safer, and More Meaningfully**

> Transform travel from simply seeing places to truly understanding them, with instant AI explanations, real-time translation, and cultural guidance powered by Google Gemini multimodal ecosystem.

---

## Table of Contents

1. [Repository Overview](#repository-overview--team-introduction)
2. [Project Overview](#project-overview)
3. [Key Features](#key-features)
4. [Technologies Used](#overview-of-technologies-used)
5. [Implementation Details & Innovation](#implementation-details--innovation)
6. [Challenges Faced](#challenges-faced)
7. [Future Roadmap](#future-roadmap)
8. [Installation & Setup](#installation--setup)

---

## Repository Overview

### **Team: TravelLens by KitaBest**

This project was built for **KitaHack 2026** - a hackathon focused on AI-powered solutions addressing UN Sustainable Development Goals.

### **Repository Structure**

```
TravelLens/
├── src/
│   ├── app/
│   │   ├── components/        # React UI components
│   │   ├── services/          # API integrations (Gemini, Firebase, Maps)
│   │   ├── config/            # Firebase configuration
│   │   ├── types/             # TypeScript types
│   │   └── data/              # Mock/static data
│   ├── styles/                # Tailwind CSS + theme
│   └── main.tsx               # Entry point
├── docs/                      # Documentation
├── .env.example               # Environment template
├── package.json               # Dependencies
├── vite.config.ts             # Build configuration
└── README.md                  # This file
```

---

## Project Overview

### **Problem Statement**

Modern travelers face three critical barriers:

1. **Language Barriers** - Can't understand signs, menus, or cultural notices
2. **Information Overload** - Must juggle multiple apps (maps, translate, blogs)
3. **Cultural Confusion** - Lack knowledge of local etiquette, leading to disrespectful behavior

**Example Scenario:**
> You're in a Thai temple and see a sign. You don't speak Thai. You can translate the words, but you don't understand *why* it matters or what you should do. Is it a warning? A rule? Cultural protocol?

**Current Solutions Are Insufficient:**
- Google Translate: Translates words, not context
- Travel blogs: Generic, outdated, not real-time
- Tour guides: Expensive, time-limited, not scalable
- Maps: Show locations, don't explain meaning

**Solution: TravelLens** - One app that explains, translates, and guides in real-time.

---

### **SDG Alignment**

#### **Primary: SDG 4 - Quality Education**
- **Contribution:** Turns the world into a classroom by providing instant historical and cultural mini-lessons.
- **Real Impact:** Users reported learning 3-5 new cultural facts when using the app.

#### **Secondary: SDG 11 - Sustainable Cities & Communities**
- **Contribution:** Encourages respectful tourism via "Cultural Etiquette" alerts and promotes "Hidden Gems" in under-visited areas (like rural Kelantan) to decentralize mass tourism.
- **Real Impact:** Testers successfully identified local dress codes/etiquette via AI alerts.

#### **Tertiary: SDG 10 – Reduced Inequalities**
- **Contribution:** Breaks language and access barriers by enabling travelers to instantly translate signs, menus, and cultural information through AI photo capture, making knowledge accessible regardless of background or budget.
- **Real Impact:** Testers were able to confidently navigate foreign-language environments and understand local contexts without relying on tour guides or prior language skills.
---

### **Solution Description**

TravelLens is a mobile web app that:

1. **Captures your surroundings** via smartphone camera
2. **Uses Google Gemini AI** to instantly analyze and explain what you're seeing
3. **Translates text** in 14+ languages with cultural context (not just word-for-word)
4. **Provides cultural guidance** – etiquette, dress codes, safety tips, and historical notes
5. **Discovers nearby attractions** using Google Maps with cultural context, even in places that aren’t on the tourist map. The system surfaces hidden gems around you, so a user wandering in a small town like Kelantan still gets meaningful suggestions.
6. **Helps plan your trip** by generating AI-driven itineraries based on your preferences – great when you don’t know where to go.
7. **Lets you save & share** experiences as travel journal posts with a community, spreading awareness of off‑the‑beaten‑path locations.

**Core User Journey:**
```
Take Photo → AI Explanation → Translate Text → View Nearby Places → Save to Journal
```

---

## Key Features

### **1. AI Lens: Beyond Object Recognition**
- **What it does:** Analyzes any photo and provides instant cultural context.
- **Powered by:** Google Gemini 2.5 Flash Vision 
- **Example:** Photograph a temple → Get architecture explanation + dress code + historical context

---

### **2. AI Contextual Translation** 
- **What it does:** Translates text while explaining its practical significance.
- **Powered by:** Google Gemini Vision 
- **Feature:** Traveler's Tip explains why the text matters (e.g., "This is a priority seat sign").

---

### **3. AI Chatbot with Context** 
- **What it does:** Ask follow-up questions about places/images you see.
- **Powered by:** Google Gemini LLM with image + location context
- **Features:**
  - Voice input support (Web Speech API)
  - Context-aware responses
  - Suggested questions carousel
  - Chat history within session
- **Example:** Photo analysis complete → Ask "Is this safe to visit?" → AI responds with safety info

---

### **4. Discovery Map: Surfacing Hidden Gems** 
- **What it does:** Suggest places to visit—even when you’re standing in an obscure neighbourhood or a non‑tourist town, that the local heritage and community spots often missed by standard maps.
- **Powered by:** Google Maps API + Places API
- **Impact:** Great for exploring rural areas where standard "top 10" lists fail.

---

### **5. Smart Itinerary Planner** 
- **What it does:** When you’re unsure where to go, tell the app your interests (culture, food, adventure, history) and let AI generate a personalised day‑by‑day itinerary. Works in cities or remote regions where you don’t know the highlights.
- **Powered by:** Gemini LLM + Google Maps data

---

### **6. AI For You Feed (Free-Tier Friendly)** 
- **What it does:** Personalizes journal recommendations based on each user's behavior
- **Powered by:** Gemini `text-embedding-004` + Firestore + client-side cosine similarity
- **Cold start behavior:** Falls back to engagement ranking (likes/saves/views/comments)

---

### **7. Travel Journal & Community** 
- **What it does:** Save experiences and share with global community
- **Features:**
  - Create journal posts 
  - Edit or add your own thoughts
  - Choose public/private
  - Like, save, and view other travelers' posts
  - See cultural insights from other travelers — especially valuable for off‑the‑beaten‑path locations discovered via the Nearby tab
  - Get the notifications when someone comments

---

## Overview of Technologies Used

### **Google Technologies (Primary Stack)**

| Technology | Purpose | Why Chosen |
|-----------|---------|------------|
| **Gemini 2.5 Flash** | AI image analysis + explanations | Google's most powerful vision model; free tier; production-ready |
| **Gemini Vision API** | Text extraction + translation | Same unified API; no separate service needed |
| **Gemini Embeddings API** | Semantic vectors for recommendation | Free-tier friendly and low-latency |
| **Google Maps API** | Location services & nearby searches | Most accurate, real-time, familiar to users |
| **Google Places API** | Attraction discovery & details | Integrated with Maps; rich place data |
| **Firebase Auth** | User authentication | Secure, scalable, multi-factor support |
| **Firebase Firestore** | Store user profiles, journal entries, vectors | Real-time sync, built-in security rules |

### **Supporting Technologies**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18.3 | Component-based UI framework |
| **Language** | TypeScript | Type safety, better DX |
| **Styling** | Tailwind CSS 4.1 | Rapid UI development, mobile-first |
| **Build Tool** | Vite | Fast development server, optimized builds |
| **UI Components** | shadcn/ui (Radix UI) | Accessible, unstyled components |
| **Icons** | Lucide React | 487+ SVG icons |
| **Notifications** | Sonner | Toast notifications |
| **API Client** | @google/generative-ai | Official Gemini SDK |
| **Maps** | @react-google-maps/api | React bindings for Google Maps |

### **Architecture Diagram**
<img width="2560" height="1300" alt="image" src="https://github.com/user-attachments/assets/cb1a2656-a781-4782-83f0-581041d4d5fb" />

## Implementation Details & Innovation

### **System Architecture**

To avoid the high costs of server-side vector databases, we implemented a **Hybrid Recommendation Engine**:
1. **Embedding Generation:** New journals trigger a call to `text-embedding-004`.
2. **User Interest Vector:** User interactions (likes/saves) update a local interest vector.
3. **Local Ranking:** The `For You` feed calculates similarity on-device, ensuring user privacy and zero infrastructure cost.

### **AI Lens System Prompting**

We utilize a **Structured JSON Schema** in our Gemini prompts to ensure the AI always returns:
- `culturalNote`: Safety and etiquette warnings.
- `interestingFact`: Educational trivia to support SDG 4.
- `travelerTip`: Practical advice for translated text.

### **Iterative Design**

Based on testing with 10 users, we iterated on our AI prompts to move from literal labels to cultural context and added a high-visibility warning system for etiquette alerts.

---

## Challenges Faced

### **Challenge 1: Gemini API Rate Limiting (10RPM)**
**Solution:**
- Implemented exponential backoff retry logic
- Added client-side rate limiter (min 3 seconds between requests)
- Cache recent results to avoid duplicate requests
- User-friendly "Please wait" messages

### **Challenge 2: Image Quality Variation**
**Solution:**
- Enhanced prompt: "Be specific and descriptive"
- Added image validation
- User feedback: "Please use a clearer photo"
- Fallback responses for poor quality images

### **Challenge 3: Cultural Sensitivity**
**Solution:**
- Enhanced prompt to explicitly request etiquette warnings
- Added manual cultural database as fallback
- Team review of sensitive responses
- Made "culturalNote" mandatory in response schema

---

## Future Roadmap

### **Short-Term (0-6 months): Enhancing Deep Intelligence**
- **Integrated Logistical Itineraries** - Enable users to upload flight and hotel confirmations, allowing the AI to synthesize context-aware, sequenced travel plans.
- **AI Culinary Lens** - Expand the AI Lens to identify local dishes, providing users with cultural history, dietary/allergy warnings, and traditional recipes.
- **Multilingual Expansion** - Localize the app interface into 20+ languages to bridge the accessibility gap for non-native speakers and elderly travelers.
- **Contextual Audio Storytelling** - Implement a text-to-speech layer that converts cultural facts into hands-free, immersive narratives for solo walkers and sight-impaired users.

### **Medium-Term (6-12 months): Infrastructure and Knowledge Expansion**
- **Region-Specific Knowledge Packs** - Partner with cultural experts to integrate localized datasets into Gemini, providing more nuanced "unspoken rules" for specific regions.
- **Cross-Session Travel Context** - Enhance the chatbot to reference a user’s previous journals and evolving preferences across multiple trips for hyper-personalized advice.
- **Community Verification Layer** - Allow local residents and heritage guardians to "verify" or add deeper insights to AI-generated notes, ensuring ground-truth authenticity.
- **Advanced Accessibility Suite** - Deploy high-contrast modes and full screen-reader optimizations to empower travelers with diverse physical and visual needs.

### **Long-Term (12+ Months): Global Impact and Sustainability**
- **Edge AI (Offline Mode)** - Develop lightweight, quantized models for download, ensuring etiquette guidance and translation work in remote areas without data signals.
- **Institutional Partnerships** - Collaborate with schools and universities to utilize the AI Lens as a digital field-trip tool for cultural heritage and global citizenship studies.
- **Sustainability Business Model** - Launch a premium tier for unlimited AI interactions and offline capabilities while keeping core safety and educational features free for all.
- **Heritage Preservation Loop** - Use anonymized discovery data to help tourism boards identify underserved sites, redistributing footfall and securing preservation funding for local communities.

---

## Installation & Setup

### **Prerequisites**
- Node.js 18+
- npm or yarn
- A Google API key (free)
- Firebase account (free tier available)

1. **Clone the repo:** `git clone https://github.com/noname-ok/TravelLens.git`
2. **Install dependencies:** `npm install`
3. **Configure Environment:** Create a `.env.local` with your `VITE_GEMINI_API_KEY`, `VITE_GOOGLE_MAPS_KEY`, and Firebase config.
4. **Run Dev:** `npm run dev`

---

## Acknowledgments

- Built for **KitaHack 2026** hackathon
- Powered by **Google AI, Maps, and Firebase**
- Designed for travelers, by travelers
- Special thanks to all test users who provided invaluable feedback

---
