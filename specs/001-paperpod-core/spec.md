# Feature Specification: PaperPod Core — Interactive 2-Host AI Audio Research Companion

**Feature Branch**: `001-paperpod-core`  
**Created**: 2026-08-20  
**Status**: Draft  
**Input**: User description: "@[IDEA.md]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Paper Ingestion & Conversational 2-Host Audio Briefing (Priority: P1)

A university student or research engineer imports a dense academic paper (via URL or PDF upload) and immediately receives a lively, conversational audio briefing hosted by two distinct AI personas (an inquisitive analyst and a domain expert) who deconstruct complex methodologies, results, and mathematical formulas into plain language and intuitive real-world analogies.

**Why this priority**: This is the fundamental core value proposition. Without converting dense text and math into an engaging, multi-host audio conversation, no downstream visual HUD, interactive voice queries, or premium features are possible.

**Independent Test**: Can be fully tested by providing a sample 10-page arXiv PDF or URL, generating a conversational briefing, and verifying multi-host audio playback with distinct voices, natural banter, and simplified math explanations.

**Acceptance Scenarios**:

1. **Given** a user with a valid research paper PDF or online document link, **When** the user submits the document for processing, **Then** the system extracts structured sections (abstract, methodology, key findings, figures, equations) and generates a multi-speaker audio conversation within seconds.
2. **Given** a paper containing complex mathematical notation and formulas, **When** the audio briefing is generated, **Then** the hosts explain the intuition and conceptual meaning of the formulas using plain-language analogies rather than reading raw LaTeX or character syntax.
3. **Given** an active audio briefing, **When** the user interacts with the player controls (play, pause, skip 15s forward/backward, speed adjustment from 0.75x to 2.0x), **Then** the audio responds instantaneously and updates playback progress and transcript position.

---

### User Story 2 - Synchronized Visual Figure HUD (Priority: P1)

While listening to the audio briefing, the mobile screen dynamically displays a visual Heads-Up Display (HUD) that automatically crops, highlights, and zooms into the specific charts, baseline comparison tables, or structural diagrams at the exact timestamp they are mentioned by the podcast hosts.

**Why this priority**: Academic papers are heavily visual (benchmarks, ablations, system diagrams). Listening to audio without visual grounding leads to cognitive disconnect; synchronizing the visual figures provides the essential "magic moment" and comprehension bridge.

**Independent Test**: Can be fully tested by playing an episode referencing specific figures and verifying that the screen viewport smoothly transitions and zooms to the corresponding figure with correct captioning and manual pinch-to-zoom capabilities.

**Acceptance Scenarios**:

1. **Given** an audio briefing discussing experimental results (e.g., "Look at Figure 3's benchmark comparison"), **When** the audio timestamp reaches the reference, **Then** the Visual HUD automatically highlights, displays, and zooms into Figure 3 with its extracted caption.
2. **Given** a displayed figure in the HUD, **When** the user performs touch gestures (pinch-to-zoom, pan, double-tap), **Then** the figure expands smoothly for detailed inspection without interrupting audio playback.
3. **Given** an active briefing with multiple figures, **When** the user taps on any figure thumbnail in the document gallery, **Then** the audio scrubber jumps to the timestamp where that figure is discussed.

---

### User Story 3 - Live Voice Interruption & In-Context Clarification (Priority: P2)

While listening on headphones during a commute, walk, or study session, the user encounters a confusing concept or equation and interrupts the podcast by voice or tap to ask a clarifying question. The AI host pauses the main track, answers the question directly in plain English, and seamlessly resumes the podcast.

**Why this priority**: Converts passive listening into an active, tutor-like learning experience, eliminating the barrier where listeners get lost and abandon the material.

**Independent Test**: Can be fully tested by triggering a voice query during audio playback (e.g., "Wait, what does the regularization loss do here?"), verifying that audio pauses, an accurate contextual clarification is spoken by the domain expert host, and playback resumes from the interruption point.

**Acceptance Scenarios**:

1. **Given** an actively playing podcast briefing, **When** the user taps the interrupt button or speaks an interruption trigger, **Then** the playback immediately pauses and listens for the user's question.
2. **Given** a captured user query about a specific theorem or ablation, **When** the query is processed against the paper context, **Then** the domain expert host provides a concise 2-to-3 sentence explanation with an intuitive example.
3. **Given** the completion of the clarifying answer, **When** the host finishes speaking, **Then** the podcast briefing smoothly resumes from where it was paused.
4. **Given** an ambient noise environment with an unintelligible voice input, **When** processing fails, **Then** the system gently prompts the user to re-ask or type their question while preserving the current playback position.

---

### User Story 4 - Tiered Access, Subscriptions, and Dynamic Paywalls (Priority: P2)

A user explores PaperPod under a free tier (2 briefs/week, 3-minute executive summaries, 1 live question per paper) and encounters dynamic contextual paywalls when attempting to unlock full 10-15 minute deep dives, unlimited voice questions, student lifetime access, or offline downloads.

**Why this priority**: Essential for business sustainability, hackathon monetization criteria, and validating user willingness to pay across flexible subscription and student lifetime options.

**Independent Test**: Can be fully tested by simulating free-tier usage limits, triggering upgrade prompts on locked actions, completing a simulated in-app purchase transaction, and verifying instant entitlement unlock across all premium features.

**Acceptance Scenarios**:

1. **Given** a free-tier user attempting their second voice question on a paper or third paper conversion in a week, **When** the action is initiated, **Then** a contextual paywall displays Pro subscription and discounted Student pass offerings.
2. **Given** a user viewing the dynamic paywall, **When** the user selects a subscription tier or lifetime option and completes checkout, **Then** entitlements update immediately and unlock unlimited voice questions, full-length audio deep dives, high-resolution HUD, and offline downloads.
3. **Given** an active subscriber with an existing purchase, **When** launching the app on a new device or tapping "Restore Purchases" in the customer center, **Then** previous entitlements are validated and restored without errors.

---

### User Story 5 - 1-Tap High-Density Summary Cards & Audio Bookmarks (Priority: P3)

The user generates and exports a high-density, 1-page visual summary card capturing the paper's core thesis, key quantitative benchmarks, limitations, and bookmarked audio timestamps for rapid pre-meeting or pre-exam review.

**Why this priority**: High-utility productivity feature that empowers power users and students to review and share research insights without re-listening to the entire audio track.

**Independent Test**: Can be fully tested by selecting "Generate Summary Card" on a processed paper, verifying extraction of key thesis, quantitative metrics, and bookmarks, and exporting/sharing the formatted card.

**Acceptance Scenarios**:

1. **Given** a processed paper, **When** the user requests a summary card, **Then** the system compiles a structured overview containing: Core Thesis & Novelty, Key Quantitative Results, Limitations & Future Work, and Figure References.
2. **Given** a user listening to an audio briefing, **When** the user taps the bookmark icon at a critical insight, **Then** a timestamped audio bookmark is attached to the paper summary.
3. **Given** a completed summary card, **When** the user taps export or share, **Then** a formatted visual document is generated for saving or sharing to external study and note-taking workflows.

---

### User Story 6 - Spaced Research Reminders & Daily Topic Digests (Priority: P3)

The user subscribes to research categories (e.g., Artificial Intelligence, Bioengineering, Quantum Computing) or saves long papers to their queue, receiving spaced push notifications for daily topic briefings and reminders to finish queued papers.

**Why this priority**: Enhances long-term user retention, daily habit formation, and continuous engagement with research literature.

**Independent Test**: Can be fully tested by scheduling a topic digest notification or paper reminder, receiving the alert, and tapping the notification to deep-link directly into the corresponding audio briefing.

**Acceptance Scenarios**:

1. **Given** a user who opted into topic digests, **When** daily research updates in their chosen categories are published, **Then** the system sends a notification summarizing the day's top paper with a 1-tap audio play trigger.
2. **Given** a paper saved in the user's study queue that remains uncompleted after 48 hours, **When** a scheduled study reminder fires, **Then** a notification prompts the user to resume their audio briefing where they left off.
3. **Given** a user receiving a push notification, **When** the user taps the notification, **Then** the app launches and deep-links directly into the relevant paper playback screen.

---

### Edge Cases

- **Complex or Non-Standard PDF Layouts**: Multi-column documents, multi-page spanning tables, footnotes, and sidebars must be correctly ordered in the extraction flow without text interleaving or fragmented sentences.
- **Scanned or Image-Only Documents**: Papers without an embedded text layer must be detected gracefully with a clear message suggesting text-based PDF or URL sources.
- **Formula-Heavy Theoretical Papers**: Papers containing extensive proofs and dense equation chains must be synthesized into conceptual analogies rather than overwhelming the audio script with excessive verbal symbols.
- **Ambiguous or Low-Resolution Figure Embeddings**: If a figure caption is truncated or an image is missing vector clarity, the HUD falls back to displaying the nearest section heading and extracted table snippet without crashing.
- **Network Disconnections & Offline Mode**: Active subscribers who downloaded briefings offline must retain full audio playback and HUD inspection capabilities even without an active internet connection.
- **Speech Ambiguity During Interruption**: In noisy environments or when microphone input is indistinct, the audio player pauses briefly, shows a fallback message with a text-input alternative, and allows 1-tap resumption.
- **Simultaneous Entitlement & Renewal Changes**: Subscription status changes (e.g. renewal, cancellation, sandbox restoration) must be handled asynchronously with immediate UI state updates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept research papers via document file upload (PDF format) and web URLs (including standard academic repositories such as arXiv).
- **FR-002**: System MUST parse incoming documents to separate document metadata (title, authors, publication date), structured text sections, embedded figures with captions, and mathematical equations.
- **FR-003**: System MUST synthesize paper content into a dynamic two-speaker conversational script featuring two distinct roles: an inquisitive analyst (Alex) and a lead domain expert (Dr. Taylor).
- **FR-004**: System MUST convert mathematical notation, LaTeX symbols, and raw citations into natural verbal descriptions and intuitive analogies suitable for audio listening.
- **FR-005**: System MUST generate multi-voice audio with distinct, natural-sounding vocal profiles for each host, preserving conversational cadence and expressive tone.
- **FR-006**: System MUST generate synchronized timestamp markers linking specific transcript sentences and host discussions to corresponding figures and section headers in the paper.
- **FR-007**: System MUST provide a responsive audio player supporting play, pause, seek forward/backward, playback speed control (0.75x to 2.0x), and interactive scrubbing.
- **FR-008**: System MUST display an interactive Visual Figure HUD that automatically highlights, crops, and zooms in on referenced figures and tables in synchronization with audio playback timestamps.
- **FR-009**: System MUST support tactile touch gestures (pinch-to-zoom, pan, reset) within the Figure HUD without interrupting continuous audio playback.
- **FR-010**: System MUST enable users to trigger live voice or text interruptions during playback to ask clarifying questions about specific equations, terms, or findings.
- **FR-011**: System MUST pause main audio playback upon interruption, formulate a concise, in-context clarifying response delivered by the expert host persona, and seamlessly resume playback once answered.
- **FR-012**: System MUST enforce a tiered entitlement model:
  - **Free Tier**: Up to 2 paper conversions per week, 3-minute executive briefings, 1 voice interruption per paper, standard HUD resolution.
  - **Pro Tier / Student Pass**: Unlimited paper conversions, full 10–15 minute deep dive audio briefings, unlimited live voice interruptions, high-resolution auto-zoom HUD, offline downloads, and branded summary cards.
- **FR-013**: System MUST dynamically display contextual paywalls when a user exceeds free tier quotas (e.g., on the 2nd voice query or 3rd weekly conversion) without disrupting app state.
- **FR-014**: System MUST support in-app purchase transactions, recurring subscriptions (monthly/annual), discounted student passes, and purchase restoration.
- **FR-015**: System MUST provide a dedicated in-app Customer Center interface allowing users to view subscription status, manage plans, and restore past purchases.
- **FR-016**: System MUST allow users to download audio briefings and associated figure assets for offline playback when entitled to offline listening.
- **FR-017**: System MUST generate a high-density 1-page visual summary card for any processed paper, encapsulating Core Thesis, Key Benchmarks, Methodological Highlights, Limitations, and Bookmarked Timestamps.
- **FR-018**: System MUST allow users to set timestamped audio bookmarks during playback that persist across sessions and appear on the paper summary.
- **FR-019**: System MUST support scheduled push notifications for daily topic digests, newly published papers in tracked categories, and spaced study reminders for uncompleted queued papers.
- **FR-020**: System MUST support deep-linking from push notifications directly to the specific paper playback screen.
- **FR-021**: System MUST provide a searchable paper library allowing users to filter, organize, and search their imported research documents, audio briefings, and notes.

### Key Entities *(include if feature involves data)*

- **Research Document**: Represents an imported paper. Key attributes: unique identifier, title, authors, publication date, source URL/file reference, abstract, extracted sections, extracted figures, and processing status.
- **Audio Episode / Briefing**: Represents a generated conversational podcast for a document. Key attributes: episode identifier, document reference, briefing depth (executive brief vs. full deep dive), host persona configurations, audio file reference, duration, transcript segments with speaker tags, and timestamp synchronization markers.
- **Figure Asset**: Represents an extracted visual artifact from a document. Key attributes: figure identifier, document reference, figure label (e.g., "Figure 3"), caption text, high-resolution cropped image reference, bounding box coordinates, and associated audio timestamp markers.
- **Voice Interruption / Q&A Exchange**: Represents an interactive user query during playback. Key attributes: exchange identifier, episode reference, trigger timestamp, user query text/audio, host response text/audio, and resolution status.
- **User Entitlement & Subscription Profile**: Represents user access tier and quotas. Key attributes: user identifier, active tier (Free, Pro Monthly, Pro Annual, Student Lifetime), active entitlements, weekly conversion usage count, interactive query usage count, and expiration date.
- **Summary Card & Bookmark**: Represents generated takeaway artifacts. Key attributes: summary identifier, document reference, core thesis summary, quantitative takeaways, limitations, exported visual artifact reference, and timestamped audio bookmarks list.
- **Notification Schedule**: Represents user-configured alerts and digests. Key attributes: schedule identifier, user reference, subscribed research topics, notification cadence, reminder trigger timestamps, and deep-link target.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can import an academic paper (via URL or PDF) and initiate audio playback in under 15 seconds.
- **SC-002**: 95% or higher accuracy in synchronizing visual figure HUD transitions within 500 milliseconds of the host referencing the figure in the audio narrative.
- **SC-003**: Live voice interruption response latency is under 2.5 seconds from the end of user speech to the start of the host's spoken clarification.
- **SC-004**: System successfully parses and generates intelligible multi-host scripts for at least 98% of standard academic paper layouts (single-column and two-column formats).
- **SC-005**: 90% of new users successfully complete their first paper import and listen to a 3-minute executive briefing on their first session.
- **SC-006**: 100% of entitlement boundaries (free vs. pro tier limits) are accurately enforced without false lockouts or failure to unlock purchased features.
- **SC-007**: 1-Tap Summary Card generation completes in under 3 seconds from user tap to visual card display.
- **SC-008**: Push notification deep links route users directly to the targeted audio playback position with 100% reliability.

## Assumptions

- Target users are students, researchers, clinicians, and technical professionals using modern iOS, Android, or tablet mobile devices with audio output and microphone capabilities.
- Academic documents are provided in standard digital PDF format or accessible academic URLs (such as arXiv.org).
- In-app purchases, recurring billing, and store entitlement receipts are processed through standard mobile store billing platforms.
- Push notifications require operating-system level user permission; appropriate in-app fallback displays exist if notifications are declined.
- Audio synthesis and document understanding utilize standard remote multimodal processing capabilities with network connectivity required for initial document conversion and interactive voice queries.
