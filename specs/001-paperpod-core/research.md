# Research & Technology Decisions: PaperPod Core

**Feature Branch**: `001-paperpod-core`  
**Date**: 2026-08-20  
**Status**: Completed  

This document captures the architectural research, trade-off evaluations, and concrete technology selections for PaperPod, optimized for maximum capability, developer velocity, hackathon compliance, and **$0 / free-tier cost**.

---

## 1. Frontend & Mobile Client

### Decision
**Expo (React Native + React Native Web) with strict TypeScript, React Native Reanimated, Expo AV / Audio, and Lucide React Native.**

### Rationale
- **Cross-Platform Reach with Single Codebase**: Runs seamlessly on iOS simulator/devices, Android, and Web preview. Fulfills the mobile store submission track while enabling instant browser-based live demos for judges.
- **Rich Aesthetics & 60fps Motion**: React Native Reanimated and Skia/SVG deliver fluid waveform audio visualizers, tactile scrubber gestures, and smooth pinch-to-zoom spring animations for the Synchronized Figure HUD.
- **Ecosystem Integration**: Direct first-class support for `react-native-purchases` (RevenueCat) and `react-native-onesignal`.

### Alternatives Considered
- *Native iOS (Swift / SwiftUI)*: Excellent UI and performance, but locks out Android and web preview, requiring macOS for every build step and excluding web judges.
- *Flutter (Dart)*: Good UI engine, but slower integration with web audio streams and smaller ecosystem of open-source document parsing / AI prompt libraries.
- *Plain Next.js / React Web*: Fast for web, but lacks native mobile store compilation and native StoreKit / in-app purchase capabilities.

---

## 2. Database, Auth, Vector RAG & File Storage

### Decision
**Supabase (Free Tier: Managed PostgreSQL + pgvector + Supabase Auth + Supabase Storage).**

### Rationale
- **All-in-One Free Tier**: 500MB database, 1GB file storage, 50,000 monthly active auth users, and built-in `pgvector` for vector similarity search.
- **Relational Integrity with Vector Search**: Stores structured research paper entities, figure bounding boxes, timestamp markers, and chunk embeddings in a single PostgreSQL database with Row Level Security (RLS).
- **Storage Buckets**: Manages raw PDF uploads, cropped high-resolution figure PNGs, and synthesized dual-speaker MP3 audio files with public/signed CDN URLs.
- **Zero Ops**: Instant setup via Supabase CLI and dashboard migrations.

### Alternatives Considered
- *Firebase (Firestore / Cloud Storage)*: Weak relational query capabilities; complex to perform timestamp-aligned interval queries and vector similarity search without third-party extensions.
- *Self-hosted PostgreSQL on VPS*: Incurs server hosting costs and requires ongoing DevOps maintenance and backups.

---

## 3. Document Ingestion, PDF Parsing & Figure Extraction

### Decision
**Python FastAPI Ingestion Pipeline using PyMuPDF (`fitz`), pdfplumber, and BeautifulSoup (for arXiv scraping).**

### Rationale
- **High-Performance & Accurate Layout Parsing**: `PyMuPDF` runs in C-speed, accurately distinguishes two-column academic layouts, extracts text blocks in reading order, and extracts embedded raster/vector images with their exact PDF coordinates.
- **Math & Equation Detection**: Preserves inline LaTeX math markers (`$...$`, `$$...$$`) and block equations for the AI script generator to transform into intuitive speech.
- **Automated Figure Cropping**: Renders high-DPI image crops of referenced figures (e.g. Figure 1, Figure 2) and saves them directly to Supabase Storage with dimension metadata.
- **100% Free & Open Source**: Zero third-party OCR or cloud extraction fees.

### Alternatives Considered
- *Cloud OCR (AWS Textract / Google Document AI)*: High per-page fees ($1.50+ per 100 pages), slow latency, and unnecessary for standard digital academic PDFs.
- *Nougat (Meta AI)*: Heavy GPU requirement (16GB+ VRAM), high latency (30s+ per paper), impractical on free hosting.

---

## 4. AI Script Generation & Formula Translation

### Decision
**Google Gemini 3.1 Flash Lite (`gemini-3.1-flash-lite`) via OpenAI-Compatible Endpoint (`from openai import OpenAI` / `AsyncOpenAI`) with `GEMINI_BASE_URL`, `GEMINI_API_KEY`, and `GEMINI_MODEL`.**

### Rationale
- **Custom Base URL & OpenAI SDK Compatibility**: Integrates via standard `openai` Python client targeting `GEMINI_BASE_URL` (e.g. `https://cheapkeyai.shop/v1`), authenticated with `GEMINI_API_KEY`, running `GEMINI_MODEL` (`gemini-3.1-flash-lite`).
- **Generous Free Quota & High Rate Limits**: High throughput for rapid script generation without vendor lock-in.
- **Massive Context Window (1M+ tokens)**: Ingests entire 25-page papers in a single prompt without fragmentation, allowing the model to correlate Figure 3 benchmarks with Section 4 methodology.
- **Fast Structured JSON Output & Lowest Latency**: Ultra-low latency generation returning schema-validated JSON with dialogue lines (`speaker: "alex" | "taylor"`), text with spoken math analogies, and associated `figure_id` triggers.

### Implementation Snippet:
```python
import os
from openai import OpenAI, AsyncOpenAI

client = OpenAI(
    base_url=os.environ.get("GEMINI_BASE_URL", "https://cheapkeyai.shop/v1"),
    api_key=os.environ.get("GEMINI_API_KEY"),
)
```


---

## 5. Dual-Host Audio Synthesis & Timestamp Alignment

### Decision
**`edge-tts` (Microsoft Neural Voices Python Engine) with word/sentence boundary metadata generation.**

### Rationale
- **Completely Free with Studio Quality**: Utilizes Microsoft Neural TTS voices (`en-US-GuyNeural` for Alex - Curious Analyst; `en-US-AriaNeural` or `en-US-ChristopherNeural` for Dr. Taylor - Lead Researcher).
- **Exact Timing Markers**: Emits word and sentence-level offset timestamps (`offset_ms`, `duration_ms`), enabling millisecond-accurate figure HUD transitions and interactive transcript highlights.
- **Audio Stitching**: Concatenates alternating host dialogue segments into a single cohesive, high-bitrate MP3 podcast track with seamless acoustic transitions.

### Alternatives Considered
- *ElevenLabs*: Industry gold standard for voice cloning, but severely limited on free tiers (10,000 characters/month ≈ 5 minutes total).
- *OpenAI TTS (`tts-1`)*: Good voice quality, but does not provide sentence-level timestamp metadata and costs $0.015/1k characters.

---

## 6. Live Voice Interruption & Q&A RAG Engine

### Decision
**Hybrid Fast-Response Pipeline: Speech Recognition (Web Speech API / Expo Audio + Whisper Small) + Supabase pgvector RAG + Gemini 3.1 Flash Lite (`gemini-3.1-flash-lite`) + Instant Edge-TTS Response.**

### Rationale
- **Sub-1.5s Response Time**: Interruption queries target the specific active section and paper context cached in memory, producing a 2-3 sentence conversational answer in <1.2s.
- **Audio State Machine**: Player seamlessly transitions `PLAYING` $\rightarrow$ `INTERRUPT_RECORDING` $\rightarrow$ `CLARIFY_SPEAKING` $\rightarrow$ `RESUMING` without audio buffer corruption.

### Alternatives Considered
- *Full-Duplex WebRTC Voice Agent (OpenAI Realtime API)*: Extremely expensive ($0.06/min audio input + $0.24/min audio output) and overkill for structured document Q&A.

---

## 7. Monetization & Hackathon Integration

### Decision
**RevenueCat SDK (`react-native-purchases`), RevenueCat Paywalls v2, and Local StoreKit / Sandbox Testing.**

### Rationale
- **Native Hackathon Compliance**: Fulfills the core Shipaton requirement.
- **Zero Cost Sandbox**: Local StoreKit configuration file (`PaperPod.storekit`) allows testing Free, Pro Monthly ($7.99), Pro Annual ($49.99), and Student Lifetime ($39.99) tiers with $0 spent.
- **Dynamic Paywalls**: Configures paywall UI, copy, and discounts remotely from RevenueCat Dashboard without modifying app code.

---

## 8. Summary of Free Tier Architecture

| Component | Technology | Free Tier Capability | Cost |
| :--- | :--- | :--- | :---: |
| **Mobile & Web Client** | React Native (Expo) + TypeScript | Open source, Expo Go free testing | $0 |
| **Backend API & Ingestion** | Python FastAPI + PyMuPDF | Local or free cloud runner (Render / Railway free tier) | $0 |
| **Database & Vector Storage** | Supabase (Postgres + pgvector) | 500MB DB, 1GB Storage, 50k Auth MAU | $0 |
| **Multimodal LLM Core** | Gemini 3.1 Flash Lite (AI Studio) | 15 RPM / 1M TPM free quota | $0 |
| **Dual-Voice Audio Engine** | `edge-tts` (Microsoft Neural) | Unlimited neural synthesis with timestamps | $0 |
| **In-App Purchases** | RevenueCat SDK + StoreKit Sandbox | Free tier up to $2,500 monthly revenue | $0 |
| **Push Notifications** | OneSignal Mobile SDK | Free tier up to 10,000 subscribers | $0 |
| **Total Operational Cost** | — | — | **$0.00** |
