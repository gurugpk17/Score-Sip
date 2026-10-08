-- ==============================================================================
-- RUMMY 7'S — STORAGE SETUP MIGRATION
-- Migration: 20261007000001_storage_setup.sql
-- Description: Provision 'game-snaps' storage bucket and storage RLS policies
-- ==============================================================================

-- 1. PROVISION 'game-snaps' BUCKET
-- Public bucket configuration enables direct CDN image serving for card snapshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'game-snaps',
    'game-snaps',
    true,
    10485760, -- 10MB limit per image
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. STORAGE POLICIES
-- Allow public / anon read access to photos in 'game-snaps'
DROP POLICY IF EXISTS "allow_public_read_game_snaps" ON storage.objects;
CREATE POLICY "allow_public_read_game_snaps"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game-snaps');

-- Allow authenticated and anon uploads to 'game-snaps'
DROP POLICY IF EXISTS "allow_anon_upload_game_snaps" ON storage.objects;
CREATE POLICY "allow_anon_upload_game_snaps"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'game-snaps');

-- Allow updates to photos in 'game-snaps'
DROP POLICY IF EXISTS "allow_anon_update_game_snaps" ON storage.objects;
CREATE POLICY "allow_anon_update_game_snaps"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'game-snaps')
WITH CHECK (bucket_id = 'game-snaps');

-- Allow deletion of photos in 'game-snaps'
DROP POLICY IF EXISTS "allow_anon_delete_game_snaps" ON storage.objects;
CREATE POLICY "allow_anon_delete_game_snaps"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'game-snaps');
