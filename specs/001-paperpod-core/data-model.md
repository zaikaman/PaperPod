# Data Model: PaperPod Core

**Feature Branch**: `001-paperpod-core`  
**Date**: 2026-08-20  
**Database**: PostgreSQL (via Supabase) with `pgvector` extension  

This document defines the relational database schema, vector embeddings, entity relationships, validation rules, and state machines for PaperPod.

---

## 1. Entity Relationship Diagram

```
 ┌───────────────┐          1:1          ┌───────────────────────────┐
 │     users     │ ────────────────────▶ │     user_entitlements     │
 └───────┬───────┘                       └───────────────────────────┘
         │
         │ 1:N
         ▼
 ┌───────────────┐          1:N          ┌───────────────────────────┐
 │    papers     │ ────────────────────▶ │      paper_sections       │
 └───────┬───────┘                       └───────────────────────────┘
         │
         ├───────────────── 1:N ───────▶ ┌───────────────────────────┐
         │                               │       paper_figures       │
         │                               └─────────────┬─────────────┘
         ├───────────────── 1:N ───────▶ ┌─────────────▼─────────────┐
         │                               │       summary_cards       │
         │                               └───────────────────────────┘
         │ 1:N
         ▼
 ┌───────────────┐          1:N          ┌───────────────────────────┐
 │   episodes    │ ────────────────────▶ │ episode_dialogue_segments │
 └───────┬───────┘                       └───────────────────────────┘
         │
         ├───────────────── 1:N ───────▶ ┌───────────────────────────┐
         │                               │  voice_interruption_logs  │
         │                               └───────────────────────────┘
         │
         └───────────────── 1:N ───────▶ ┌───────────────────────────┐
                                         │      audio_bookmarks      │
                                         └───────────────────────────┘
```

---

## 2. Table Specifications

### 2.1 `users`
Represents an authenticated account (synced with `auth.users` in Supabase).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, REFERENCES auth.users(id)` | Unique user identifier |
| `email` | `TEXT` | `NOT NULL, UNIQUE` | User email address |
| `display_name` | `TEXT` | `NULL` | Full or display name |
| `avatar_url` | `TEXT` | `NULL` | Profile avatar URL |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record update timestamp |

### 2.2 `user_entitlements`
Tracks the user's active tier, subscription state, and quota usage.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `UUID` | `PRIMARY KEY, REFERENCES users(id) ON DELETE CASCADE` | Associated user |
| `tier` | `TEXT` | `NOT NULL, DEFAULT 'free'` | `free`, `pro_monthly`, `pro_annual`, `student_lifetime` |
| `revenuecat_customer_id` | `TEXT` | `NULL` | Associated RevenueCat App User ID |
| `weekly_conversions_used` | `INT` | `DEFAULT 0` | Conversions consumed this rolling week |
| `weekly_reset_at` | `TIMESTAMPTZ` | `DEFAULT NOW() + INTERVAL '7 days'` | Next quota reset timestamp |
| `is_student_verified` | `BOOLEAN` | `DEFAULT FALSE` | True if verified for student pricing |
| `entitlement_expires_at` | `TIMESTAMPTZ` | `NULL` | Subscription expiration (null for lifetime/free) |

### 2.3 `papers`
Represents an ingested academic paper or technical document.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique paper identifier |
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` | Document owner/uploader |
| `title` | `TEXT` | `NOT NULL` | Extracted or entered paper title |
| `authors` | `TEXT[]` | `DEFAULT '{}'` | Array of author names |
| `publication_date` | `DATE` | `NULL` | Extracted publication date |
| `arxiv_id` | `TEXT` | `NULL` | e.g. `2403.12345` if ingested via arXiv |
| `source_type` | `TEXT` | `NOT NULL` | `pdf_upload`, `arxiv_url`, `web_url` |
| `source_url` | `TEXT` | `NULL` | Origin URL if applicable |
| `pdf_storage_path` | `TEXT` | `NOT NULL` | Supabase Storage path for original PDF |
| `abstract` | `TEXT` | `NULL` | Extracted paper abstract |
| `total_pages` | `INT` | `DEFAULT 1` | Total page count |
| `status` | `TEXT` | `NOT NULL, DEFAULT 'pending'` | `pending`, `parsing`, `ready`, `failed` |
| `error_message` | `TEXT` | `NULL` | Processing error details if failed |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Upload timestamp |

### 2.4 `paper_sections`
Structured text sections extracted from the paper with vector embeddings for RAG.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Section identifier |
| `paper_id` | `UUID` | `NOT NULL, REFERENCES papers(id) ON DELETE CASCADE` | Parent paper |
| `section_index` | `INT` | `NOT NULL` | Reading order sequence |
| `heading` | `TEXT` | `NOT NULL` | e.g., "1. Introduction", "3. Methodology" |
| `content_text` | `TEXT` | `NOT NULL` | Cleaned plain text content |
| `latex_equations` | `JSONB` | `DEFAULT '[]'` | Array of extracted LaTeX formula blocks |
| `embedding` | `vector(1536)` | `NULL` | Vector embedding for interruption Q&A |

### 2.5 `paper_figures`
Extracted visual figures, tables, and architectural diagrams with HUD coordinates.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Figure identifier |
| `paper_id` | `UUID` | `NOT NULL, REFERENCES papers(id) ON DELETE CASCADE` | Parent paper |
| `figure_number` | `TEXT` | `NOT NULL` | e.g. "Figure 1", "Table 2" |
| `caption` | `TEXT` | `NOT NULL` | Extracted figure caption |
| `storage_path` | `TEXT` | `NOT NULL` | High-res PNG path in Supabase Storage |
| `page_number` | `INT` | `NOT NULL` | Page index in original PDF |
| `bounding_box` | `JSONB` | `NOT NULL` | `{ "x0": 50, "y0": 100, "x1": 500, "y1": 400 }` |
| `aspect_ratio` | `FLOAT` | `DEFAULT 1.0` | Width / Height ratio |

### 2.6 `episodes`
Synthesized 2-host conversational audio briefings.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Episode identifier |
| `paper_id` | `UUID` | `NOT NULL, REFERENCES papers(id) ON DELETE CASCADE` | Source paper |
| `user_id` | `UUID` | `NOT NULL, REFERENCES users(id) ON DELETE CASCADE` | Episode owner |
| `depth_type` | `TEXT` | `NOT NULL, DEFAULT 'executive_brief'` | `executive_brief` (3min), `deep_dive` (15min) |
| `duration_seconds` | `INT` | `NOT NULL, DEFAULT 0` | Total audio playback length |
| `audio_storage_path` | `TEXT` | `NOT NULL` | Supabase Storage path to concatenated MP3 |
| `status` | `TEXT` | `NOT NULL, DEFAULT 'generating'` | `generating`, `ready`, `failed` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Generation timestamp |

### 2.7 `episode_dialogue_segments`
Fine-grained dialogue turns with millisecond timestamp markers for HUD synchronization.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Segment identifier |
| `episode_id` | `UUID` | `NOT NULL, REFERENCES episodes(id) ON DELETE CASCADE` | Parent episode |
| `sequence_index` | `INT` | `NOT NULL` | Turn index in conversation |
| `speaker` | `TEXT` | `NOT NULL` | `alex` (Curious Analyst) or `taylor` (Lead Researcher) |
| `dialogue_text` | `TEXT` | `NOT NULL` | Spoken script turn |
| `audio_start_ms` | `INT` | `NOT NULL` | Start offset in episode MP3 |
| `audio_end_ms` | `INT` | `NOT NULL` | End offset in episode MP3 |
| `referenced_figure_id` | `UUID` | `NULL, REFERENCES paper_figures(id)` | Active figure to display in HUD during this turn |

### 2.8 `voice_interruption_logs`
Logs interactive questions asked during playback and the spoken clarifications.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Exchange identifier |
| `episode_id` | `UUID` | `NOT NULL, REFERENCES episodes(id) ON DELETE CASCADE` | Active episode |
| `user_id` | `UUID` | `NOT NULL, REFERENCES users(id) ON DELETE CASCADE` | User who asked |
| `trigger_timestamp_ms` | `INT` | `NOT NULL` | Scrubber position when interrupted |
| `query_text` | `TEXT` | `NOT NULL` | Transcribed user query |
| `response_text` | `TEXT` | `NOT NULL` | Host clarification text |
| `response_audio_url` | `TEXT` | `NULL` | Clarification TTS audio snippet URL |
| `latency_ms` | `INT` | `NOT NULL` | Processing latency from query to speech |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Interruption timestamp |

### 2.9 `summary_cards`
1-page high-density summary artifacts.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Summary card identifier |
| `paper_id` | `UUID` | `NOT NULL, REFERENCES papers(id) ON DELETE CASCADE` | Source paper |
| `core_thesis` | `TEXT` | `NOT NULL` | Executive summary of novelty |
| `quantitative_results` | `JSONB` | `DEFAULT '[]'` | Key metrics and benchmark table |
| `limitations` | `TEXT[]` | `DEFAULT '{}'` | Identified paper caveats |
| `future_work` | `TEXT[]` | `DEFAULT '{}'` | Future exploration avenues |
| `card_pdf_url` | `TEXT` | `NULL` | Exportable branded PDF card URL |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |

### 2.10 `audio_bookmarks`
Timestamped user notes saved during playback.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Bookmark identifier |
| `episode_id` | `UUID` | `NOT NULL, REFERENCES episodes(id) ON DELETE CASCADE` | Episode reference |
| `user_id` | `UUID` | `NOT NULL, REFERENCES users(id) ON DELETE CASCADE` | Owner |
| `timestamp_ms` | `INT` | `NOT NULL` | Scrubber timestamp |
| `note_text` | `TEXT` | `NULL` | Optional user notation |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |

---

## 3. Paper Processing State Machine

```
  [ UPLOAD / URL SUBMIT ]
            │
            ▼
     ┌─────────────┐
     │   pending   │
     └──────┬──────┘
            │ Worker initiates PyMuPDF extraction
            ▼
     ┌─────────────┐
     │   parsing   │ ─── (Extraction / LLM failure) ───▶ ┌────────────┐
     └──────┬──────┘                                     │   failed   │
            │ Sections, Figures & Audio ready            └────────────┘
            ▼
     ┌─────────────┐
     │    ready    │
     └─────────────┘
```
