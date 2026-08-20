-- ==============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Core schema for PaperPod (PostgreSQL + pgvector)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Custom Types & Enums
DO $$ BEGIN
    CREATE TYPE paper_source_type AS ENUM ('pdf_upload', 'arxiv_url', 'web_url');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE paper_status AS ENUM ('pending', 'parsing', 'ready', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE episode_depth_type AS ENUM ('executive_brief', 'deep_dive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE episode_status AS ENUM ('generating', 'ready', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE speaker_role AS ENUM ('alex', 'taylor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entitlement_tier AS ENUM ('free', 'pro_monthly', 'pro_annual', 'student_lifetime');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Users Table (Public Profile synced with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Entitlements Table (RevenueCat / Quota Tracking)
CREATE TABLE IF NOT EXISTS public.user_entitlements (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    tier entitlement_tier NOT NULL DEFAULT 'free',
    revenuecat_customer_id TEXT,
    weekly_conversions_used INT NOT NULL DEFAULT 0,
    weekly_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    is_student_verified BOOLEAN NOT NULL DEFAULT FALSE,
    entitlement_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Papers Table
CREATE TABLE IF NOT EXISTS public.papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}',
    publication_date DATE,
    arxiv_id TEXT,
    source_type paper_source_type NOT NULL DEFAULT 'pdf_upload',
    source_url TEXT,
    pdf_storage_path TEXT NOT NULL,
    abstract TEXT,
    total_pages INT NOT NULL DEFAULT 1,
    status paper_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Paper Sections Table (Structured text + LaTeX + Vector Embeddings for RAG)
CREATE TABLE IF NOT EXISTS public.paper_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    section_index INT NOT NULL,
    heading TEXT NOT NULL,
    content_text TEXT NOT NULL,
    latex_equations JSONB NOT NULL DEFAULT '[]'::jsonb,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Paper Figures Table (Extracted charts, diagrams, tables with HUD bounding boxes)
CREATE TABLE IF NOT EXISTS public.paper_figures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    figure_number TEXT NOT NULL,
    caption TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    page_number INT NOT NULL,
    bounding_box JSONB NOT NULL, -- { "x0": float, "y0": float, "x1": float, "y1": float }
    aspect_ratio FLOAT NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Episodes Table (Dual-Host Audio Briefings)
CREATE TABLE IF NOT EXISTS public.episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    depth_type episode_depth_type NOT NULL DEFAULT 'executive_brief',
    duration_seconds INT NOT NULL DEFAULT 0,
    audio_storage_path TEXT NOT NULL,
    status episode_status NOT NULL DEFAULT 'generating',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Episode Dialogue Segments Table (Turn-by-turn timestamps & HUD triggers)
CREATE TABLE IF NOT EXISTS public.episode_dialogue_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    sequence_index INT NOT NULL,
    speaker speaker_role NOT NULL,
    dialogue_text TEXT NOT NULL,
    audio_start_ms INT NOT NULL,
    audio_end_ms INT NOT NULL,
    referenced_figure_id UUID REFERENCES public.paper_figures(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Voice Interruption Logs Table (Live Q&A clarifications during playback)
CREATE TABLE IF NOT EXISTS public.voice_interruption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    trigger_timestamp_ms INT NOT NULL,
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    response_audio_url TEXT,
    latency_ms INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Summary Cards Table (1-Page High-Density Cards)
CREATE TABLE IF NOT EXISTS public.summary_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    core_thesis TEXT NOT NULL,
    quantitative_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    limitations TEXT[] NOT NULL DEFAULT '{}',
    future_work TEXT[] NOT NULL DEFAULT '{}',
    card_pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Audio Bookmarks Table (User notes during audio playback)
CREATE TABLE IF NOT EXISTS public.audio_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    timestamp_ms INT NOT NULL,
    note_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_papers_user_id ON public.papers(user_id);
CREATE INDEX IF NOT EXISTS idx_papers_arxiv_id ON public.papers(arxiv_id);
CREATE INDEX IF NOT EXISTS idx_paper_sections_paper_id ON public.paper_sections(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_figures_paper_id ON public.paper_figures(paper_id);
CREATE INDEX IF NOT EXISTS idx_episodes_paper_id ON public.episodes(paper_id);
CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON public.episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_segments_episode_id_seq ON public.episode_dialogue_segments(episode_id, sequence_index);
CREATE INDEX IF NOT EXISTS idx_segments_timestamp_range ON public.episode_dialogue_segments(episode_id, audio_start_ms, audio_end_ms);
CREATE INDEX IF NOT EXISTS idx_bookmarks_episode_user ON public.audio_bookmarks(episode_id, user_id);

-- 14. Vector Similarity Index (HNSW for pgvector fast cosine search)
CREATE INDEX IF NOT EXISTS idx_sections_embedding_hnsw 
ON public.paper_sections 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 15. Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_user_entitlements_updated_at
BEFORE UPDATE ON public.user_entitlements
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_papers_updated_at
BEFORE UPDATE ON public.papers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_episodes_updated_at
BEFORE UPDATE ON public.episodes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 16. Vector Search Helper RPC for Interruption RAG
CREATE OR REPLACE FUNCTION public.match_paper_sections(
    p_paper_id UUID,
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    paper_id UUID,
    section_index INT,
    heading TEXT,
    content_text TEXT,
    latex_equations JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.id,
        ps.paper_id,
        ps.section_index,
        ps.heading,
        ps.content_text,
        ps.latex_equations,
        1 - (ps.embedding <=> query_embedding) AS similarity
    FROM public.paper_sections ps
    WHERE ps.paper_id = p_paper_id
      AND ps.embedding IS NOT NULL
      AND (1 - (ps.embedding <=> query_embedding)) > match_threshold
    ORDER BY ps.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
