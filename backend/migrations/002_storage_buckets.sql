-- ==============================================================================
-- Migration: 002_storage_buckets.sql
-- Description: Create Supabase Storage buckets & RLS Policies for papers, figures, audio
-- ==============================================================================

-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('papers', 'papers', true, 52428800, ARRAY['application/pdf']), -- 50MB max PDF
    ('figures', 'figures', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp']), -- 10MB max image
    ('audio', 'audio', true, 104857600, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav']) -- 100MB max audio
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for Public Reading (Free CDN Delivery)
DO $$ BEGIN
    CREATE POLICY "Public Access for Papers" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'papers');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public Access for Figures" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'figures');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public Access for Audio" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'audio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Storage Policies for Authenticated Uploads
DO $$ BEGIN
    CREATE POLICY "Authenticated Users Can Upload Papers" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'papers' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated Users Can Upload Figures" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'figures' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated Users Can Upload Audio" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'audio' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
