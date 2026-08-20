# 🎙️ ArXivCast (PaperPod) — Product Specification & Hackathon Blueprint

> **Tagline**: The Interactive 2-Host AI Audio Research Companion  
> **Elevator Pitch**: Turn dense, 25-page academic papers and technical PDFs into lively, interactive 2-person podcasts you can interrupt anytime to ask questions, complete with a synchronized visual figure HUD.

---

## 🎯 1. Target Tracks & Award Stacking Strategy

ArXivCast is strategically designed to compete across multiple prize pools simultaneously:

| Award Track | Prize Pool | Strategy & Qualification |
| :--- | :--- | :--- |
| 🥇 **Next Gen Award** *(Primary)* | **$20,000** (1st) + NYC Trip + Times Square Billboard | Student-focused research companion submitted with open-source code and a 2-minute demo video (No paid Apple/Google developer fee needed). |
| 🎨 **RevenueCat Design Award** | **$20,000** (1st) | Exquisite audio wave visualizers, synchronized PDF figure HUD, tactile scrubbers, and fluid spring animations. |
| ⚡️ **Influencer Award — Productivity (Christopher Lawley)** | **$20,000** (1st) | Fast, focused place for power users to capture, organize, and retrieve research papers, text snippets, figures, and audio insights. |
| 🔔 **OneSignal "Keep Them Coming Back"** | **$25,000** (1st) | Smart spaced push notifications for paper updates, daily arXiv topic digests, and saved-paper audio reminders. |
| 📣 **#BuildInPublic Award** | **$30,000** (1st) | Documenting the audio pipeline, waveform UI experiments, and RevenueCat paywall iterations on Twitter/X and Discord. |

---

## 💥 2. The Problem & Market Opportunity

### The Acute Pain Point:
1. **Cognitive Overload**: University students, researchers, engineers, and clinicians are required to digest dozens of 20+ page academic papers (arXiv, IEEE, Nature, PubMed) every week.
2. **Text-to-Speech (TTS) Fails**: Existing TTS tools are completely unlistenable for academic papers. They mechanically read raw LaTeX equations (`\sum_{i=1}^n`), citation brackets `[12, 14-16]`, table formatting, and raw URLs.
3. **Passive vs. Active Listening**: Normal podcasts are static. When a listener doesn't understand a complex theorem or ablation study, they can't stop the hosts to ask for clarification.

### The Solution:
ArXivCast converts technical literature into an **interactive audio experience** with two distinct AI hosts (an inquisitive analyst and a domain expert) who explain complex math and methodology using intuitive analogies, allowing the listener to interrupt at any point to ask questions.

---

## ✨ 3. Core Features & "Magic Moments"

```
 ┌───────────────────┐       ┌───────────────────────────────┐       ┌────────────────────────────┐
 │  1. INGESTION     │  ───▶ │    2. INTERACTIVE AUDIO POD   │  ───▶ │   3. SYNCHRONIZED HUD      │
 │  arXiv URL / PDF  │       │  2-Host banter + Analogies    │       │  Auto-zooms to Fig 3 chart │
 └───────────────────┘       └───────────────┬───────────────┘       └────────────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────────┐
                               │   4. LIVE VOICE INTERRUPTION  │
                               │   "Wait, explain equation 4!" │
                               └───────────────────────────────┘
```

### 1. 2-Host Conversational Audio Engine
- **Host A (Alex — The Curious Analyst)**: Asks the hard questions, spots practical trade-offs, and demands intuitive intuition.
- **Host B (Dr. Taylor — The Lead Researcher)**: Deconstructs the architecture, math formulas, and benchmarks into plain English and crystal-clear analogies.
- **Formula Translation**: Translates complex math notation into human logic (*"Instead of reading raw matrix notation, Taylor explains: 'Think of this attention matrix as a spotlight focusing only on previous relevant words...'"*).

### 2. Live Voice Interruption ("Wait, Explain That!")
- While listening on headphones during a walk, commute, or gym session:
- **Action**: Tap the screen or speak: *"Wait, what is $L_{reg}$ doing in equation 4?"*
- **Response**: The audio seamlessly pauses. Dr. Taylor answers the question directly in 2 sentences, gives an intuitive example, and resumes the podcast without missing a beat.

### 3. Synchronized Visual Figure HUD
- As the audio discusses *"Look at Figure 3's benchmark comparison against baseline models"*, the mobile screen automatically highlights, crops, and zooms in on that exact chart or table in the PDF.
- Interactive pinch-to-zoom and synchronized transcript timestamps.

### 4. 1-Tap Knowledge Flash Summary
- Export a high-density 1-page visual summary card with:
  - Core Thesis & Novelty.
  - Key Benchmarks & Quantitative Results.
  - Limitations & Future Work.
  - Audio snippet bookmarks for quick review before exams or lab meetings.

---

## 💳 4. RevenueCat Monetization & Subscription Architecture

ArXivCast leverages the full suite of RevenueCat capabilities to build a robust, ethical, and high-converting monetization flow.

### Tier Structure:

| Feature | Free Tier | ArXivCast Pro ($7.99/mo or $49.99/yr) | Student Lifetime ($39.99) |
| :--- | :---: | :---: | :---: |
| **Weekly Paper Conversions** | 2 papers / week | **Unlimited** | **Unlimited** |
| **Audio Depth** | 3-minute executive brief | **Full 10–15 min Deep Dive** | **Full Deep Dive** |
| **Live Voice Interruption** | 1 question / paper | **Unlimited Interactivity** | **Unlimited Interactivity** |
| **Synchronized Figure HUD** | Basic | **High-Res Auto-Zoom HUD** | **High-Res Auto-Zoom HUD** |
| **Offline Audio Downloads** | ❌ | ✅ Full offline listening | ✅ Full offline listening |
| **Exportable Summary Cards** | Standard | **Custom Branded PDF Cards** | **Custom Branded PDF Cards** |

### RevenueCat Integration Highlights:
1. **Dynamic Paywalls (RevenueCat Paywalls v2)**: Remote paywall template that allows real-time copy and pricing experiments without redeploying code.
2. **Contextual Paywall Triggers**:
   - Triggered when the user taps "Interrupt & Ask Voice Question" for the second time.
   - Triggered when attempting to generate a 3rd paper in a week.
   - Triggered when requesting an offline audio download.
3. **Student Verification Promo Offer**: Targeted annual subscription discount ($29.99/yr instead of $49.99/yr) powered by RevenueCat Offering Metadata.
4. **RevenueCat Customer Center**: Integrated self-service subscription management, plan changes, and restore purchases interface.

---

## 🛠️ 5. Technical Architecture & Stack

```
                                  ┌───────────────────────────────┐
                                  │      MOBILE CLIENT (FRONTEND) │
                                  │   React Native (Expo) / iOS   │
                                  └───────────────┬───────────────┘
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                ▼                                 ▼                                 ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
│     REVENUECAT PURCHASES      │ │        AI MULTIMODAL CORE     │ │    AUDIO & NOTIFICATIONS      │
│ • Purchases SDK               │ │ • PDF/arXiv Parser (PyMuPDF)  │ │ • Dual-voice TTS Synthesizer  │
│ • Dynamic Paywalls v2         │ │ • Multimodal Script Generator │ │ • Synchronized Audio Player   │
│ • Customer Center             │ │ • Figure Cropping & Alignment │ │ • OneSignal Notification SDK  │
│ • Local StoreKit / Sandbox    │ │ • Live Interruption Q&A RAG   │ │                               │
└───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘
```

- **Frontend**: React Native (Expo) or native SwiftUI with Lucide icons, Framer/Reanimated spring animations, and native haptic feedback.
- **RevenueCat SDK**: `react-native-purchases` or `PurchasesHybridCommon` configured with Sandbox / StoreKit configuration for $0 testing.
- **AI Processing Pipeline**:
  - Document & Figure Parsing: Extracts paper sections, math formulas, and high-res vector figures.
  - Script Generation: LLM transforms structured sections into a dual-host conversational dialogue.
  - Voice Synthesis: Multi-voice TTS with synchronized word/figure timestamp metadata.
- **Push & Retention Engine**: OneSignal SDK for scheduled paper drops and study reminders.

---

## 🎬 6. The 2-Minute Winning Demo Video Storyboard

Every second of the video is engineered to maximize judges' engagement and satisfy all criteria:

| Time | Visual on Screen | Audio / Narration |
| :--- | :--- | :--- |
| **0:00 – 0:20** | Split screen: A stressed student staring at a dense 30-page PDF with walls of raw equations. | *"Reading research papers is exhausting. And standard text-to-speech sounds like a robot reading raw math code. Meet ArXivCast."* |
| **0:20 – 0:50** | Paste an arXiv URL into ArXivCast. In 3 seconds, a sleek audio wave player appears with two host avatars (Alex & Taylor). | *"Paste any arXiv link or drop a PDF. ArXivCast instantly produces a lively 2-host audio briefing that explains complex algorithms using intuitive real-world analogies."* |
| **0:50 – 1:15** | The user is walking outside with headphones. The hosts discuss Figure 3. The screen smoothly zooms into Figure 3's benchmark chart. | *"As the hosts discuss experimental results, the Synchronized Figure HUD auto-zooms into the exact benchmark chart on your screen."* |
| **1:15 – 1:35** | **The Magic Moment**: User taps the screen: *"Wait, what is equation 4 doing?"* The podcast pauses, Dr. Taylor explains the math intuitively, and resumes. | *"Got confused? Just interrupt. Ask any question, and the AI host clarifies in plain English before resuming the podcast seamlessly."* |
| **1:35 – 1:50** | Tap to download summary card $\rightarrow$ Sleek RevenueCat Paywall v2 appears with Student Offer and Customer Center. | *"Powered by RevenueCat, ArXivCast offers flexible subscriptions, student passes, and instant paywall experiments."* |
| **1:50 – 2:00** | Final hero shot of the open-source GitHub repository and app running smoothly. | *"ArXivCast: Making research accessible, conversational, and effortless for the next generation of builders."* |

---

## 📋 7. Next Gen Submission Checklist

- [ ] **Open Source GitHub Repository**: Clean TypeScript / Swift codebase with full setup documentation and architecture diagrams.
- [ ] **RevenueCat Integration**: Working SDK initialization, entitlement verification, dynamic paywall trigger, and local StoreKit configuration.
- [ ] **2-Minute Demo Video**: High-res screen capture on real device/simulator with clear voiceover, highlighting the problem, interactive interruption, HUD sync, and RevenueCat paywall.
- [ ] **OneSignal Integration**: Configured push notifications for paper release alerts.
- [ ] **Devpost Submission Form**: Text description, 1024x1024 app icon, and 1179x2556 screenshots.
