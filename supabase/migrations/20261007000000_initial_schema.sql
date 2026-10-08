-- ==============================================================================
-- RUMMY 7'S — DATABASE SCHEMA MIGRATION
-- Migration: 20261007000000_initial_schema.sql
-- Description: Normalized relational schema for Rummy 7's scorekeeper
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PLAYERS TABLE
-- Tracks roster members participating in game nights
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    seat_number INTEGER NOT NULL DEFAULT 1,
    is_host BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    initials TEXT NOT NULL DEFAULT '',
    avatar_color TEXT NOT NULL DEFAULT '#10b981',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SESSIONS TABLE
-- Master record for each game match / night
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
    game_config JSONB NOT NULL,
    current_round_number INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    is_finalized BOOLEAN NOT NULL DEFAULT false,
    tea_settled BOOLEAN NOT NULL DEFAULT false,
    table_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. SESSION_PLAYERS TABLE
-- Join table recording players assigned to a specific session
CREATE TABLE IF NOT EXISTS session_players (
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL DEFAULT 1,
    is_host BOOLEAN DEFAULT false,
    initials TEXT DEFAULT '',
    avatar_color TEXT DEFAULT '#10b981',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (session_id, player_id)
);

-- 5. ROUNDS TABLE
-- Tracks individual rounds within each session
CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    multiplier NUMERIC NOT NULL DEFAULT 1,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, round_number)
);

-- 6. ROUND_SCORES TABLE
-- Granular score entries per player per round
CREATE TABLE IF NOT EXISTS round_scores (
    id TEXT PRIMARY KEY,
    round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    base_score NUMERIC NOT NULL DEFAULT 0,
    multiplier NUMERIC NOT NULL DEFAULT 1,
    final_score NUMERIC NOT NULL DEFAULT 0,
    score_type TEXT NOT NULL CHECK (score_type IN ('dick', 'full', 'custom')) DEFAULT 'custom',
    entered BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (round_id, player_id)
);

-- 7. SESSION_RESULTS TABLE
-- Official scorecard outcomes calculated upon session finalization
CREATE TABLE IF NOT EXISTS session_results (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    total_score NUMERIC NOT NULL DEFAULT 0,
    final_position INTEGER NOT NULL DEFAULT 1,
    is_winner BOOLEAN NOT NULL DEFAULT false,
    isRunner_up BOOLEAN NOT NULL DEFAULT false,
    is_tea_duty BOOLEAN NOT NULL DEFAULT false,
    dick_hands_count INTEGER NOT NULL DEFAULT 0,
    busts_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, player_id)
);

-- 8. PLAYER_STATS TABLE
-- Aggregate career statistics per player (idempotently maintained)
CREATE TABLE IF NOT EXISTS player_stats (
    player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    sessions_played INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    runner_ups INTEGER NOT NULL DEFAULT 0,
    tea_bought INTEGER NOT NULL DEFAULT 0,
    average_score NUMERIC NOT NULL DEFAULT 0,
    best_score NUMERIC NOT NULL DEFAULT 0,
    worst_score NUMERIC NOT NULL DEFAULT 0,
    win_ratio NUMERIC NOT NULL DEFAULT 0,
    recent_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. GAME_PHOTOS TABLE
-- Photo metadata linking Supabase Storage assets to game sessions
CREATE TABLE IF NOT EXISTS game_photos (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    game_name TEXT NOT NULL DEFAULT '',
    session_name TEXT NOT NULL DEFAULT '',
    storage_path TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT NOT NULL DEFAULT '',
    sub_caption TEXT,
    tag TEXT,
    badge TEXT,
    player_initials TEXT[] DEFAULT '{}',
    likes INTEGER NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_by TEXT
);

-- 10. APP_SETTINGS TABLE
-- Stores key/value metadata such as active_session_id
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. INDEXES
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_players_session ON session_players(session_id);
CREATE INDEX IF NOT EXISTS idx_session_players_player ON session_players(player_id);
CREATE INDEX IF NOT EXISTS idx_rounds_session ON rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_round_scores_round ON round_scores(round_id);
CREATE INDEX IF NOT EXISTS idx_round_scores_session ON round_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_round_scores_player ON round_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_session_results_session ON session_results(session_id);
CREATE INDEX IF NOT EXISTS idx_session_results_player ON session_results(player_id);
CREATE INDEX IF NOT EXISTS idx_game_photos_session ON game_photos(session_id);
CREATE INDEX IF NOT EXISTS idx_game_photos_uploaded_at ON game_photos(uploaded_at DESC);

-- 12. ROW LEVEL SECURITY (RLS)
-- Enable RLS across all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 13. POLICIES: PASS-AND-PLAY FRIENDS GROUP (ANON & AUTHENTICATED ACCESS)
-- ==============================================================================
-- Note: Score-Sip functions as a private pass-and-play card table app.
-- In this operational model, clients communicate via the Supabase anon key.
-- All operations are permitted for anon & authenticated roles.
-- When full multi-tenant user authentication is enabled, these policies
-- can be replaced by tenancy policies scoped to auth.uid() or organization_id.

-- PLAYERS POLICIES
DROP POLICY IF EXISTS "allow_all_players_select" ON players;
CREATE POLICY "allow_all_players_select" ON players FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow_all_players_insert" ON players;
CREATE POLICY "allow_all_players_insert" ON players FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_players_update" ON players;
CREATE POLICY "allow_all_players_update" ON players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_players_delete" ON players;
CREATE POLICY "allow_all_players_delete" ON players FOR DELETE TO anon, authenticated USING (true);

-- SESSIONS POLICIES
DROP POLICY IF EXISTS "allow_all_sessions_select" ON sessions;
CREATE POLICY "allow_all_sessions_select" ON sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow_all_sessions_insert" ON sessions;
CREATE POLICY "allow_all_sessions_insert" ON sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_sessions_update" ON sessions;
CREATE POLICY "allow_all_sessions_update" ON sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_sessions_delete" ON sessions;
CREATE POLICY "allow_all_sessions_delete" ON sessions FOR DELETE TO anon, authenticated USING (true);

-- SESSION_PLAYERS POLICIES
DROP POLICY IF EXISTS "allow_all_session_players_select" ON session_players;
CREATE POLICY "allow_all_session_players_select" ON session_players FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow_all_session_players_insert" ON session_players;
CREATE POLICY "allow_all_session_players_insert" ON session_players FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_session_players_update" ON session_players;
CREATE POLICY "allow_all_session_players_update" ON session_players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_session_players_delete" ON session_players;
CREATE POLICY "allow_all_session_players_delete" ON session_players FOR DELETE TO anon, authenticated USING (true);

-- ROUNDS POLICIES
DROP POLICY IF EXISTS "allow_all_rounds_select" ON rounds;
CREATE POLICY "allow_all_rounds_select" ON rounds FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow_all_rounds_insert" ON rounds;
CREATE POLICY "allow_all_rounds_insert" ON rounds FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_rounds_update" ON rounds;
CREATE POLICY "allow_all_rounds_update" ON rounds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_rounds_delete" ON rounds;
CREATE POLICY "allow_all_rounds_delete" ON rounds FOR DELETE TO anon, authenticated USING (true);

-- ROUND_SCORES POLICIES
DROP POLICY IF EXISTS "allow_all_round_scores_select" ON round_scores;
CREATE POLICY "allow_all_round_scores_select" ON round_scores FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow_all_round_scores_insert" ON round_scores;
CREATE POLICY "allow_all_round_scores_insert" ON round_scores FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_round_scores_update" ON round_scores;
CREATE POLICY "allow_all_round_scores_update" ON round_scores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_round_scores_delete" ON round_scores;
CREATE POLICY "allow_all_round_scores_delete" ON round_scores FOR DELETE TO anon, authenticated USING (true);

-- SESSION_RESULTS POLICIES
DROP POLICY IF EXISTS "allow_all_session_results_select" ON session_results;
CREATE POLICY "allow_all_session_results_select" ON session_results FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow_all_session_results_insert" ON session_results;
CREATE POLICY "allow_all_session_results_insert" ON session_results FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_session_results_update" ON session_results;
CREATE POLICY "allow_all_session_results_update" ON session_results FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_session_results_delete" ON session_results;
CREATE POLICY "allow_all_session_results_delete" ON session_results FOR DELETE TO anon, authenticated USING (true);

-- PLAYER_STATS POLICIES
DROP POLICY IF EXISTS "allow_all_player_stats_select" ON player_stats;
CREATE POLICY "allow_all_player_stats_select" ON player_stats FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow_all_player_stats_insert" ON player_stats;
CREATE POLICY "allow_all_player_stats_insert" ON player_stats FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_player_stats_update" ON player_stats;
CREATE POLICY "allow_all_player_stats_update" ON player_stats FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_player_stats_delete" ON player_stats;
CREATE POLICY "allow_all_player_stats_delete" ON player_stats FOR DELETE TO anon, authenticated USING (true);

-- GAME_PHOTOS POLICIES
DROP POLICY IF EXISTS "allow_all_game_photos_select" ON game_photos;
CREATE POLICY "allow_all_game_photos_select" ON game_photos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow_all_game_photos_insert" ON game_photos;
CREATE POLICY "allow_all_game_photos_insert" ON game_photos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_game_photos_update" ON game_photos;
CREATE POLICY "allow_all_game_photos_update" ON game_photos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_game_photos_delete" ON game_photos;
CREATE POLICY "allow_all_game_photos_delete" ON game_photos FOR DELETE TO anon, authenticated USING (true);

-- APP_SETTINGS POLICIES
DROP POLICY IF EXISTS "allow_all_app_settings_select" ON app_settings;
CREATE POLICY "allow_all_app_settings_select" ON app_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow_all_app_settings_insert" ON app_settings;
CREATE POLICY "allow_all_app_settings_insert" ON app_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_app_settings_update" ON app_settings;
CREATE POLICY "allow_all_app_settings_update" ON app_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_app_settings_delete" ON app_settings;
CREATE POLICY "allow_all_app_settings_delete" ON app_settings FOR DELETE TO anon, authenticated USING (true);
