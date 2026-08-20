# Quickstart Guide: PaperPod Development & Local Testing

**Feature Branch**: `001-paperpod-core`  
**Date**: 2026-08-20  

This guide gets you up and running with the PaperPod client (Expo React Native / Web) and backend AI ingestion pipeline using 100% free-tier services.

---

## 1. Prerequisites

- **Node.js**: v18+ or v20+ (`npm` or `pnpm`)
- **Python**: 3.10+ or 3.11+
- **Google AI Studio API Key** (Free tier from [aistudio.google.com](https://aistudio.google.com))
- **Supabase Account** (Free tier from [supabase.com](https://supabase.com))
- **RevenueCat Sandbox Account** (Free from [revenuecat.com](https://revenuecat.com))

---

## 2. Environment Configuration

### Backend (`backend/.env`)
```env
PORT=8000
GEMINI_API_KEY=your_google_ai_studio_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STORAGE_BUCKET_PAPERS=papers
STORAGE_BUCKET_FIGURES=figures
STORAGE_BUCKET_AUDIO=audio
```

### Mobile / Web Client (`client/.env`)
```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_test_your_key
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_test_your_key
EXPO_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id
```

---

## 3. Database & Storage Initialization

1. Create a new Supabase project (Free Tier).
2. Execute the schema migration in the Supabase SQL Editor from [`specs/001-paperpod-core/data-model.md`](./data-model.md).
3. Enable Public / Authenticated read policies on the `papers`, `figures`, and `audio` storage buckets.

---

## 4. Backend Ingestion & Audio Service

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Verify backend health:
```bash
curl http://localhost:8000/health
# Response: {"status": "ok", "service": "PaperPod AI Core"}
```

---

## 5. Mobile & Web Frontend (Expo)

```bash
cd client
npm install

# Run in Web Browser for fast preview:
npm run web

# Or run in Expo Go / iOS Simulator / Android Emulator:
npx expo start
```

---

## 6. Testing Primary User Journeys

### Test 1: Ingest arXiv Paper & Audio Generation
1. Open the PaperPod client.
2. In the Ingestion bar, paste arXiv URL: `https://arxiv.org/abs/1706.03762` (Attention Is All You Need).
3. Tap **"Generate Audio Briefing"**.
4. Observe the extracted sections and figure crops.
5. Tap **Play** to hear Alex and Dr. Taylor explain the Multi-Head Attention mechanism and see the Figure HUD auto-zoom to Figure 1 and Figure 2.

### Test 2: Live Voice Interruption
1. While audio is playing, tap the microphone icon or tap **"Ask Host"**.
2. Speak or enter: *"Wait, how does scaled dot-product attention prevent large values?"*
3. Verify that Dr. Taylor answers concisely in 2 sentences and audio resumes automatically.

### Test 3: RevenueCat Dynamic Paywall & Customer Center
1. Attempt a second voice interruption or trigger a 15-minute Deep Dive.
2. Verify the RevenueCat Paywall v2 opens with monthly, annual, and student pass options.
3. Test sandbox purchase or tap "Restore Purchases" in the Customer Center.
