-- ==============================================================================
-- SCORE & SIP — USER OWNERSHIP & RLS SECURITY MIGRATION
-- Migration: 20261010000000_user_ownership_and_rls.sql
-- Description: Scopes players, sessions, statistics, and photos to auth.users.id
--              Enforces strict multi-tenant Row Level Security (RLS) isolation.
-- ==============================================================================

-- 1. ADD USER_ID TO ROOT ENTITIES
ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE game_photos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. CREATE INDEXES FOR FAST USER-SCOPED QUERIES
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_photos_user_id ON game_photos(user_id);

-- 3. DROP LEGACY OPEN "ALLOW_ALL" POLICIES
DROP POLICY IF EXISTS "allow_all_players_select" ON players;
DROP POLICY IF EXISTS "allow_all_players_insert" ON players;
DROP POLICY IF EXISTS "allow_all_players_update" ON players;
DROP POLICY IF EXISTS "allow_all_players_delete" ON players;

DROP POLICY IF EXISTS "allow_all_sessions_select" ON sessions;
DROP POLICY IF EXISTS "allow_all_sessions_insert" ON sessions;
DROP POLICY IF EXISTS "allow_all_sessions_update" ON sessions;
DROP POLICY IF EXISTS "allow_all_sessions_delete" ON sessions;

DROP POLICY IF EXISTS "allow_all_session_players_select" ON session_players;
DROP POLICY IF EXISTS "allow_all_session_players_insert" ON session_players;
DROP POLICY IF EXISTS "allow_all_session_players_update" ON session_players;
DROP POLICY IF EXISTS "allow_all_session_players_delete" ON session_players;

DROP POLICY IF EXISTS "allow_all_rounds_select" ON rounds;
DROP POLICY IF EXISTS "allow_all_rounds_insert" ON rounds;
DROP POLICY IF EXISTS "allow_all_rounds_update" ON rounds;
DROP POLICY IF EXISTS "allow_all_rounds_delete" ON rounds;

DROP POLICY IF EXISTS "allow_all_round_scores_select" ON round_scores;
DROP POLICY IF EXISTS "allow_all_round_scores_insert" ON round_scores;
DROP POLICY IF EXISTS "allow_all_round_scores_update" ON round_scores;
DROP POLICY IF EXISTS "allow_all_round_scores_delete" ON round_scores;

DROP POLICY IF EXISTS "allow_all_session_results_select" ON session_results;
DROP POLICY IF EXISTS "allow_all_session_results_insert" ON session_results;
DROP POLICY IF EXISTS "allow_all_session_results_update" ON session_results;
DROP POLICY IF EXISTS "allow_all_session_results_delete" ON session_results;

DROP POLICY IF EXISTS "allow_all_player_stats_select" ON player_stats;
DROP POLICY IF EXISTS "allow_all_player_stats_insert" ON player_stats;
DROP POLICY IF EXISTS "allow_all_player_stats_update" ON player_stats;
DROP POLICY IF EXISTS "allow_all_player_stats_delete" ON player_stats;

DROP POLICY IF EXISTS "allow_all_game_photos_select" ON game_photos;
DROP POLICY IF EXISTS "allow_all_game_photos_insert" ON game_photos;
DROP POLICY IF EXISTS "allow_all_game_photos_update" ON game_photos;
DROP POLICY IF EXISTS "allow_all_game_photos_delete" ON game_photos;

DROP POLICY IF EXISTS "allow_all_app_settings_select" ON app_settings;
DROP POLICY IF EXISTS "allow_all_app_settings_insert" ON app_settings;
DROP POLICY IF EXISTS "allow_all_app_settings_update" ON app_settings;
DROP POLICY IF EXISTS "allow_all_app_settings_delete" ON app_settings;

-- 4. STRICT ROW LEVEL SECURITY POLICIES (AUTHENTICATED USER ISOLATION)

-- PLAYERS: Owned directly by auth.uid()
CREATE POLICY "user_players_select" ON players
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_players_insert" ON players
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_players_update" ON players
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_players_delete" ON players
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- SESSIONS: Owned directly by auth.uid()
CREATE POLICY "user_sessions_select" ON sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_insert" ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_sessions_update" ON sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_sessions_delete" ON sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- SESSION_PLAYERS: Belongs to session owned by auth.uid()
CREATE POLICY "user_session_players_select" ON session_players
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_players.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_session_players_insert" ON session_players
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_players.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_session_players_update" ON session_players
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_players.session_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_players.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_session_players_delete" ON session_players
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_players.session_id AND s.user_id = auth.uid()
  ));

-- ROUNDS: Belongs to session owned by auth.uid()
CREATE POLICY "user_rounds_select" ON rounds
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = rounds.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_rounds_insert" ON rounds
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = rounds.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_rounds_update" ON rounds
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = rounds.session_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = rounds.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_rounds_delete" ON rounds
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = rounds.session_id AND s.user_id = auth.uid()
  ));

-- ROUND_SCORES: Belongs to session owned by auth.uid()
CREATE POLICY "user_round_scores_select" ON round_scores
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = round_scores.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_round_scores_insert" ON round_scores
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = round_scores.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_round_scores_update" ON round_scores
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = round_scores.session_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = round_scores.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_round_scores_delete" ON round_scores
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = round_scores.session_id AND s.user_id = auth.uid()
  ));

-- SESSION_RESULTS: Belongs to session owned by auth.uid()
CREATE POLICY "user_session_results_select" ON session_results
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_results.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_session_results_insert" ON session_results
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_results.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_session_results_update" ON session_results
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_results.session_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_results.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "user_session_results_delete" ON session_results
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_results.session_id AND s.user_id = auth.uid()
  ));

-- PLAYER_STATS: Owned directly by auth.uid()
CREATE POLICY "user_player_stats_select" ON player_stats
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_player_stats_insert" ON player_stats
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_player_stats_update" ON player_stats
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_player_stats_delete" ON player_stats
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- GAME_PHOTOS: Owned directly by auth.uid()
CREATE POLICY "user_game_photos_select" ON game_photos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_game_photos_insert" ON game_photos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_game_photos_update" ON game_photos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_game_photos_delete" ON game_photos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. STORAGE BUCKET RLS (GAME-SNAPS ISOLATION)
-- Objects are partitioned under `<user_id>/<session_id>/<filename>`
DROP POLICY IF EXISTS "allow_public_read_game_snaps" ON storage.objects;
DROP POLICY IF EXISTS "allow_anon_upload_game_snaps" ON storage.objects;
DROP POLICY IF EXISTS "allow_anon_update_game_snaps" ON storage.objects;
DROP POLICY IF EXISTS "allow_anon_delete_game_snaps" ON storage.objects;

CREATE POLICY "user_read_game_snaps"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'game-snaps'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "user_upload_game_snaps"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game-snaps'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "user_update_game_snaps"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'game-snaps'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'game-snaps'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "user_delete_game_snaps"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'game-snaps'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
