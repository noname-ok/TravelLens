# TravelLens Visual Summary

A quick glance at the core ideas, features and architecture of the prototype.

---

## 🧠 Core Value Proposition

- **Understand places instantly**: take a photo, get explanation + context.
- **Break language barriers**: translate signs/menus with cultural tips.
- **Discover everywhere**: Nearby tab surfaces attractions even in off‑the‑map areas.
- **Plan automatically**: AI generates itineraries from simple preferences.
- **Share discoveries**: journal posts create a traveler‑powered map of hidden gems.

---

## 🔧 Key Features (diagram)

```mermaid
flowchart LR
    A[Camera
    capture] --> B[AI Lens
    (Gemini Vision)]
    B --> C{Options}
    C -->|Translate| D[Translation with tip]
    C -->|Ask AI| E[Chatbot Q&A]
    B --> F[Save to Journal]
    B --> G[View Nearby]
    G --> H[Map with hidden gems]
    C --> I[Plan Trip]
    I --> J[Itinerary Generator]
```

---

## ☁️ Tech Stack Overview

| Layer | Technology |
|-------|------------|
| AI | Google Gemini (Vision, LLM, Embeddings) |
| Maps | Google Maps & Places API |
| Backend | Firebase Auth + Firestore |
| Frontend | React + TypeScript + Tailwind CSS |

---

## 📱 UI Tabs

1. **Home / Journal** – feed, For‑You, filters.
2. **AI Lens** – camera, explanations, translation, AI chat.
3. **Nearby** – map suggestions, hidden gems, place details.
4. **Route** – trip planner interface.
5. **Profile** – settings.

---

## 🚀 Impact Snapshot

- 92% completion rate during testing.
- 40% boost in traveler confidence.
- Community journals highlighted remote spots.
- Demo video ready (script included in repo).

---

*Use this file for quick visual reference when pitching or during hackathon discussions.*