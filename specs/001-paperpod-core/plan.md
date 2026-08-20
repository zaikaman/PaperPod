# Implementation Plan: PaperPod Core — Interactive 2-Host AI Audio Research Companion

**Branch**: `001-paperpod-core` | **Date**: 2026-08-20 | **Spec**: [specs/001-paperpod-core/spec.md](file:///d:/Shipaton/specs/001-paperpod-core/spec.md)  
**Input**: Feature specification from `specs/001-paperpod-core/spec.md` with zero-cost/free-tier tech stack and Supabase backend.

---

## Summary

PaperPod converts dense academic research papers (PDFs and arXiv links) into lively, interactive 2-host audio briefings with a synchronized visual figure HUD and low-latency voice interruption ("Wait, explain equation 4!"). 

The implementation utilizes an ultra-lean, 100% free-tier architecture:
- **Mobile/Web Client**: React Native (Expo) with strict TypeScript, Reanimated 60fps animations, Expo Audio, and RevenueCat SDK.
- **Backend API & Ingestion**: Python FastAPI microservice utilizing `PyMuPDF` for PDF/figure parsing, Google Gemini 3.1 Flash Lite (`gemini-3.1-flash-lite`, free tier) for conversational script generation and math analogies, and `edge-tts` for multi-voice neural speech synthesis with timestamp alignment.
- **Database & Storage**: Supabase (PostgreSQL with `pgvector` for RAG, Supabase Storage for PDFs/figures/audio, Supabase Auth).
- **Monetization & Retention**: RevenueCat Dynamic Paywalls v2 + StoreKit sandbox testing, and OneSignal for spaced study reminders and paper digests.

---

## Technical Context

**Language/Version**: TypeScript 5.4+ (Client/Web), Python 3.11+ (Backend)  
**Primary Dependencies**: 
- *Client*: Expo SDK 51+, React Native, React Native Reanimated, Expo Audio/AV, Lucide React Native, `react-native-purchases` (RevenueCat), `react-native-onesignal`, `@supabase/supabase-js`.
- *Backend*: FastAPI, Uvicorn, `pymupdf` (fitz), `pdfplumber`, `google-genai` (`gemini-3.1-flash-lite`), `edge-tts`, `pydantic-v2`.  
**Storage**: Supabase Managed PostgreSQL (with `pgvector` extension) + Supabase Storage buckets (`papers`, `figures`, `audio`).  
**Testing**: 
- *Client*: Jest, React Native Testing Library.
- *Backend*: `pytest`, `pytest-asyncio`, `httpx` for API contract testing with local deterministic mock fixtures.  
**Target Platform**: iOS 15+, Android 10+, Modern Web Browsers (Chrome/Safari/Firefox).  
**Project Type**: Mobile Application + Ingestion/AI Backend Web Service.  
**Performance Goals**: 
- Paper ingestion & script generation: $< 15\text{s}$ total turnaround.
- Live voice interruption clarification latency: $< 1.5\text{s}$ (p95).
- Figure HUD visual transition: $< 100\text{ms}$ upon audio timestamp trigger.
- UI rendering: Constant 60 fps on mobile client with $< 150\text{MB}$ peak memory.  
**Constraints**: $0 operational cost (100% free tier services: Supabase Free, Gemini AI Studio Free, Edge-TTS, RevenueCat Free, OneSignal Free).  
**Scale/Scope**: Support 10k+ free tier users, 25-page academic papers, 15-minute dual-speaker episodes with synchronized figure tracking.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Design Verification |
| :--- | :--- | :---: | :--- |
| **I. Code Quality & Modularity (MUST)** | 100% strict TypeScript on client, typed Python backend, clear 5-domain separation. | ✅ PASSED | Client and backend separated into modular domains (`ingestion`, `script-engine`, `audio-player`, `hud-visualizer`, `purchases`). |
| **II. Rigorous Testing Standards (NON-NEGOTIABLE)** | Automated test-driven discipline, $\ge 80\%$ unit coverage, deterministic fixtures without live paid APIs. | ✅ PASSED | All Gemini and Edge-TTS responses have local JSON/audio fixtures in `tests/fixtures/`. |
| **III. User Experience & Design Consistency (MUST)** | Tailored typography, tactile audio visualizers, synchronized figure HUD overlays, zero-friction interruption state transitions. | ✅ PASSED | Custom dark/light palettes, Reanimated spring gestures for pinch-to-zoom, smooth audio state machine (`PLAYING` $\rightarrow$ `INTERRUPT` $\rightarrow$ `RESUME`). |
| **IV. Performance & Low-Latency Requirements (MUST)** | Interruption response $<1.5\text{s}$, audio start $<300\text{ms}$, 60 fps UI, $<150\text{MB}$ memory. | ✅ PASSED | Fast vector section retrieval + Gemini Flash + streaming audio chunks meet latency budgets. |
| **V. Architectural Simplicity & Extensibility (SHOULD)** | Avoid over-engineering, keep dependencies lean and justified. | ✅ PASSED | Zero unnecessary microservices; direct Supabase integration for DB/Storage/Auth; Python handles document and audio processing. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-paperpod-core/
├── plan.md              # This implementation plan
├── research.md          # Technology decisions & free-tier evaluations
├── data-model.md        # Supabase PostgreSQL schema, tables & state machines
├── quickstart.md        # Local environment & end-to-end testing guide
├── contracts/           # API and purchase contracts
│   ├── api-ingestion.yaml
│   ├── api-audio.yaml
│   └── api-purchases.yaml
└── checklists/
    └── requirements.md  # Spec quality validation checklist
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/                 # FastAPI routes (papers, episodes, interruptions)
│   ├── core/                # Config, logging, Supabase client
│   ├── services/
│   │   ├── parser.py        # PyMuPDF PDF & arXiv extraction + figure cropper
│   │   ├── script_gen.py    # Gemini 3.1 Flash Lite 2-host script generator
│   │   ├── audio_tts.py     # Edge-TTS multi-voice synthesis & timestamp alignment
│   │   └── interruption.py  # Live voice Q&A RAG engine
│   └── models/              # Pydantic schemas & DB entity models
├── tests/
│   ├── fixtures/            # Mock PDFs, transcripts, and audio files
│   ├── unit/                # Parser, script generator, and timeline tests
│   └── integration/         # API endpoint and RAG tests
├── requirements.txt
└── Dockerfile

client/
├── src/
│   ├── components/
│   │   ├── audio/           # Waveform visualizer, scrubber, speed controls
│   │   ├── hud/             # Synchronized Figure HUD with pinch-to-zoom
│   │   ├── interruption/    # Live voice mic trigger & host clarification bubble
│   │   ├── summary/         # 1-Tap high-density summary cards
│   │   └── paywall/         # RevenueCat dynamic paywall & Customer Center
│   ├── screens/
│   │   ├── HomeScreen.tsx   # Paper ingestion & recent library
│   │   ├── PlayerScreen.tsx # Interactive podcast player & HUD
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   ├── api.ts           # Backend ingestion & timeline client
│   │   ├── audioPlayer.ts   # Expo Audio playback engine with timestamp hooks
│   │   ├── purchases.ts     # RevenueCat SDK wrapper & entitlement cache
│   │   └── supabase.ts      # Supabase client & real-time listeners
│   └── types/               # Strict TypeScript definitions
├── package.json
├── app.json                 # Expo configuration & plugins
└── tsconfig.json
```

**Structure Decision**: Clean client/backend monorepo layout separating the cross-platform Expo client (`client/`) from the Python document/audio AI service (`backend/`).

---

## Complexity Tracking

| Aspect | Justification | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *Python Backend for Extraction* | Required for `PyMuPDF` C-bindings to extract high-res vector figures and exact page bounding boxes. | Client-side PDF rendering in JS cannot reliably isolate standalone figures and LaTeX math equations. |
| *Edge-TTS with Timestamp Extraction* | Delivers high-fidelity neural voices with exact word/sentence offsets at $0 cost. | Standard browser SpeechSynthesis sounds robotic and lacks precise audio buffer streaming for multi-host banter. |
