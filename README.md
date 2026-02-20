
  # MVP Flow Design Steps

  This is a code bundle for MVP Flow Design Steps. The original project is available at https://www.figma.com/design/WH7xxeLAbC8VYKaXJQq7bR/MVP-Flow-Design-Steps.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  


  # TravelLens - AI Travel Explainer & Smart Cultural Guide

## What It Does
1. Take a photo → Gemini AI explains what you're seeing
2. Real-time translation (14+ languages)
3. Discover nearby attractions using Google Maps
4. Save experiences as travel journal posts
5. Ask follow-up questions with AI chatbot

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS
- **AI:** Google Gemini 2.5 Flash
- **Maps:** Google Maps API + Places API
- **Backend:** Firebase (Auth + Realtime DB)
- **Build:** Vite

## Quick Start
1. Get API key from https://aistudio.google.com/app/apikey
2. Create `.env.local`: `VITE_GEMINI_API_KEY=your_key`
3. `npm install && npm run dev`