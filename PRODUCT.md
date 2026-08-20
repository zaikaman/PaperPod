# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users
- Primary: STEM students (undergraduate/graduate), PhD researchers, AI/ML engineers, and clinicians who must ingest dozens of dense, 20+ page academic papers (arXiv, PubMed, IEEE, Nature) weekly.
- Core Situation: On-the-go listening during daily commutes, gym sessions, walks, or pre-lab prep when sitting in front of a laptop is inconvenient.
- Primary Job: Rapidly comprehend complex methodologies, mathematical formulations, and experimental benchmarks without cognitive fatigue or robotic TTS recitation.

## Product Purpose
PaperPod converts dense academic PDFs and arXiv URLs into an interactive, engaging 2-host audio podcast briefing featuring dual AI personas (an inquisitive analyst and a lead domain expert). It bridges the gap between passive listening and active study through in-context voice interruptions ("Wait, explain equation 4!") and a synchronized visual figure HUD that zooms into relevant charts and benchmark tables in real-time.

## Positioning
Unlike generic Text-to-Speech tools that mechanically read raw LaTeX code, citation brackets, and malformed tables, PaperPod translates mathematical notation and complex logic into intuitive conversational analogies, provides live bidirectional voice clarification mid-playback, and anchors the audio with dynamic auto-zooming PDF figures.

## Operating Context
- Environments: Mobile-first usage (iPhone on iOS 17/18+), often with AirPods/headphones while moving or multitasking.
- Inputs: arXiv links, direct PDF file uploads, or imported paper identifiers.
- Key Workflows:
  1. Instant ingestion & structured section parsing (Abstract, Methodology, Key Findings, Equations, Figures).
  2. Dual-host conversational podcast playback with audio wave visualizer and scrubber.
  3. Real-time visual figure HUD auto-focusing on referenced charts/tables.
  4. Live tap/voice interruption for instant host Q&A clarification.
  5. 1-Tap high-density summary card export and audio bookmark retrieval.
  6. Contextual dynamic paywalls (RevenueCat) unlocking unlimited papers, deep dives, and student passes.

## Capabilities and Constraints
- Dual-Host Script Engine: Generates multi-speaker dialogue balancing Host A (Alex — inquisitive analyst) and Host B (Dr. Taylor — expert researcher).
- Plain-English Math Translation: Translates equations ($L_{reg}$, matrix attention) into intuitive verbal explanations.
- Voice Interruption: Intercepts playback, retrieves local paper context, speaks concise 2-sentence clarification, and smoothly resumes.
- Figure Extraction & Synchronized HUD: High-res vector cropping with timestamp-linked auto-zoom and manual pinch-to-zoom.
- Platform Constraints: Built with React Native (Expo SDK 57), native iOS feel (SF Pro typography, iOS HIG navigation, haptics via `expo-haptics`, spring physics via `react-native-reanimated`).
- Monetization: RevenueCat Paywalls v2 with tiered offerings (Free tier limits vs. PaperPod Pro and Student Lifetime Pass).

## Brand Commitments
- Name: PaperPod
- Tone & Voice: Curious, articulate, intellectually rigorous, yet approachable and warm. Never robotic, patronizing, or overly casual.
- Visual Foundation: Matte Obsidian canvas, translucent graphite glass surfaces, warm terracotta/burnt copper accents, dual-host solar amber (Alex) & electric cyan (Taylor) visual cues.

## Evidence on Hand
- Full product blueprint: `IDEA.md`
- Core specification & user stories: `specs/001-paperpod-core/spec.md`
- Implementation tasks: `specs/001-paperpod-core/tasks.md`
- Working client codebase: `client/` (Expo + React Native)
- FastAPI backend pipeline: `backend/` (FastAPI, PyMuPDF, OpenAI/Gemini script generation, Edge TTS)

## Product Principles
1. **Never Recite Syntax; Teach the Intuition**: Formulas, theorems, and citations are explained through analogies and mental models, never read as raw LaTeX characters.
2. **Audio First, Visual Grounded**: The podcast stands on its own audio merit, but the synchronized figure HUD effortlessly appears when visual comprehension matters most.
3. **Interruptibility as a Core Affordance**: Questions shouldn't wait until the end; the user can pause the hosts instantly just like talking to a real tutor.
4. **Frictionless Research Flow**: From pasting an arXiv link to listening within seconds, eliminating document setup overhead.

## Accessibility & Inclusion
- iOS Dynamic Type and VoiceOver compatibility across all touch targets and controls.
- Strict 44x44 pt minimum touch targets for high-motion scenarios (walking/commute).
- High-contrast text labels against dark surfaces, avoiding reliance on color alone for host distinction.
- Support for system "Reduce Motion" setting to gracefully tone down spring animations and zoom transitions.
