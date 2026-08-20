<!--
SYNC IMPACT REPORT
==================
Version Change: UNVERSIONED (TEMPLATE) -> 1.0.0
Ratification Date: 2026-08-20
Last Amended Date: 2026-08-20

Modified Principles:
  - [PRINCIPLE_1_NAME] -> I. Code Quality & Modularity (MUST)
  - [PRINCIPLE_2_NAME] -> II. Rigorous Testing Standards (NON-NEGOTIABLE)
  - [PRINCIPLE_3_NAME] -> III. User Experience & Design Consistency (MUST)
  - [PRINCIPLE_4_NAME] -> IV. Performance & Low-Latency Requirements (MUST)
  - [PRINCIPLE_5_NAME] -> V. Architectural Simplicity & Extensibility (SHOULD)

Added Sections:
  - Technology Stack & Architecture Baseline
  - Development Workflow & Quality Gates

Removed Sections:
  - Generic bracketed placeholders

Templates Requiring Updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check gates aligned)
  - ✅ .specify/templates/spec-template.md (Verified consistent with quality/test requirements)
  - ✅ .specify/templates/tasks-template.md (Task categories mapped to test-first and performance gates)

Follow-up / Deferred Items:
  - None (All core placeholders resolved)
-->

# ArXivCast Constitution

## Core Principles

### I. Code Quality & Modularity (MUST)
All code written across the project MUST adhere to strict clean-architecture boundaries and static type safety:
- **Type Safety**: 100% strict TypeScript on client/web interfaces and full type annotations (`mypy`/type hints) on backend Python services. Zero tolerance for unvetted `any` or ambiguous dictionary pass-throughs.
- **Modular Boundaries**: Clear separation of concerns across 5 distinct domains:
  1. *Ingestion & PDF/arXiv Extraction* (document parsing, math translation, figure vectorization)
  2. *AI Multimodal & Script Engine* (2-host dialogue generation, analogy construction, context framing)
  3. *Audio Streaming & Live Interruption* (dual-voice synthesis, timestamp HUD sync, interruption Q&A RAG)
  4. *Client UI & Experience Layer* (tactile audio visualizers, figure HUD, interactive transcripts)
  5. *Purchases & Engagement* (RevenueCat paywall triggers, Customer Center, OneSignal push notifications)
- **Documentation & Clean Code**: Every public function, API contract, and custom hook MUST have concise JSDoc/docstring documentation detailing parameters, return values, and failure modes. Dead code, console logs, and commented-out snippets are strictly forbidden in committed branches.

### II. Rigorous Testing Standards (NON-NEGOTIABLE)
Testing is an integral phase of implementation, not an afterthought:
- **Test-Driven Discipline**: Core transformation logic (e.g., LaTeX-to-speech normalization, audio/figure timestamp alignment, paywall entitlement gates, interruption state machine) MUST have automated tests written before or in lockstep with implementation.
- **Coverage & Test Pyramid**:
  - *Unit Tests*: Minimum 80% coverage on domain logic, state reducers, utility helpers, and parsers.
  - *Integration Tests*: Mandatory contract tests for RevenueCat entitlement checks, audio stream controllers, and LLM structured output parsing.
  - *End-to-End Scenarios*: Automated or script-verified test flows for primary user journeys (ingest paper $\rightarrow$ stream dual-host audio $\rightarrow$ trigger voice interruption $\rightarrow$ resume).
- **Deterministic Fixtures**: Network calls, external AI models, and TTS synthesis MUST be mockable using local deterministic fixtures in test environments. Tests MUST NOT depend on live external network states or paid API tokens.

### III. User Experience & Design Consistency (MUST)
User experience MUST feel premium, distinct, tactile, and free of generic AI template aesthetics:
- **Visual Polish & Modern Aesthetics**: Tailored typography, rich dark/light mode palettes, glassmorphism accents, tactile scrubbers, fluid spring animations (Reanimated/Framer), and synchronized visual figure HUD overlays.
- **Seamless Interactivity**: The "Live Interruption" feature MUST provide immediate visual and audio feedback. The state transitions (`Playing` $\rightarrow$ `Interrupted/Listening` $\rightarrow$ `Clarifying` $\rightarrow$ `Resuming`) MUST be smooth and zero-friction without popping audio artifacts.
- **Defensive & Resilient UX**: Graceful offline handling with cached summaries and audio, clear skeleton states during document parsing, actionable error messages, and non-blocking background jobs.

### IV. Performance & Low-Latency Requirements (MUST)
Performance budgets are hard constraints:
- **Latency Budgets**:
  - Live Voice Interruption response: $< 1.5\text{s}$ turnaround (p95) from user query to spoken clarification.
  - Audio playback initiation: $< 300\text{ms}$ buffer start time.
  - PDF figure zoom & HUD highlight transition: $< 100\text{ms}$ rendering response.
- **Rendering & Resource Optimization**: 60 fps fluid rendering on mobile devices. Main UI thread MUST NEVER be blocked by PDF parsing, audio chunk decoding, or heavy math rendering.
- **Memory & Storage Footprint**: Memory usage MUST be capped ($< 150\text{MB}$ peak on mobile client). Vector graphics and PDF rasterizations MUST be dynamically cached and purged appropriately.

### V. Architectural Simplicity & Extensibility (SHOULD)
- Avoid premature over-engineering: implement the simplest viable abstraction that satisfies the requirements (YAGNI).
- Keep dependencies lean and justified. Every external library added MUST have a clear purpose that cannot be solved cleanly with native/existing utilities.

## Technology Stack & Architecture Baseline

- **Mobile Client**: React Native (Expo) / iOS with TypeScript, Lucide icons, React Native Reanimated, and native audio/haptic modules.
- **Monetization & Subscriptions**: RevenueCat SDK (`react-native-purchases`), RevenueCat Dynamic Paywalls v2, Customer Center, StoreKit local testing configuration.
- **AI Core & Document Parsing**: Python / FastAPI microservices, PyMuPDF for high-res vector/figure extraction, structured LLM prompt pipelines for 2-host conversational script generation.
- **Audio & Push Engine**: Multi-voice neural TTS synthesis with timestamp metadata generation, OneSignal SDK for scheduled paper digests and push notifications.

## Development Workflow & Quality Gates

1. **Feature Specification & Planning**: All non-trivial features MUST begin with a Spec Kit specification (`spec.md`) and implementation plan (`plan.md`).
2. **Pre-Commit Quality Gate**: Code MUST pass formatting (`prettier`/`black`), linting (`eslint`/`ruff`), and static typecheck without errors before merging.
3. **Pull Request & Code Review**: Every PR MUST verify adherence to Constitution Principles, demonstrate passing unit/integration tests, and document any complexity tradeoffs.
4. **Semantic Versioning**: All releases and major architectural updates follow `MAJOR.MINOR.PATCH` semver convention.

## Governance

- **Supreme Authority**: This Constitution supersedes informal team conventions. All architectural decisions, pull requests, and automated agent workflows MUST verify compliance against these principles.
- **Amendment Process**: Amendments to this Constitution require:
  1. An explicit proposal detailing the rationale and impact.
  2. A corresponding version bump (MAJOR for removals/redefinitions, MINOR for additions, PATCH for refinements).
  3. Updates propagated to all dependent Spec Kit templates and guidelines.
- **Compliance Reviews**: Periodic audits during feature planning (`Constitution Check` in `plan.md`) ensure zero drift from established quality, testing, UX, and performance standards.

**Version**: 1.0.0 | **Ratified**: 2026-08-20 | **Last Amended**: 2026-08-20
