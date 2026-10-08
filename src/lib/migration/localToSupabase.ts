import { getSupabaseClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import { LocalStoragePlayerRepository, LocalStorageSessionRepository, LocalStorageStatsRepository } from '../repositories/localStorageRepo';
import { SupabasePlayerRepository, SupabaseSessionRepository, SupabaseStatsRepository } from '../repositories/supabaseRepo';

const MIGRATION_FLAG_KEY = 'rummy7s_supabase_migrated_at';

export interface MigrationSummary {
  playersMigrated: number;
  sessionsMigrated: number;
  statsMigrated: number;
  photosMigrated: number;
  completedAt: string;
}

export interface MigrationStatus {
  hasLocalData: boolean;
  isCloudConfigured: boolean;
  hasAlreadyMigrated: boolean;
  lastMigratedAt: string | null;
}

export function checkMigrationStatus(): MigrationStatus {
  const isCloud = isSupabaseConfigured();
  const lastMigratedAt = typeof window !== 'undefined' ? localStorage.getItem(MIGRATION_FLAG_KEY) : null;
  const rawSessions = typeof window !== 'undefined' ? localStorage.getItem('rummy7s_sessions_v1') : null;
  const hasLocalData = !!rawSessions && rawSessions.length > 10;

  return {
    hasLocalData,
    isCloudConfigured: isCloud,
    hasAlreadyMigrated: !!lastMigratedAt,
    lastMigratedAt
  };
}

/**
 * Safely migrates existing localStorage data to Supabase.
 * NOTE: NEVER deletes original localStorage data!
 */
export async function migrateLocalDataToSupabase(): Promise<{
  success: boolean;
  summary?: MigrationSummary;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured. Add credentials in .env.local to migrate.'
    };
  }

  try {
    const localPlayersRepo = new LocalStoragePlayerRepository();
    const localSessionsRepo = new LocalStorageSessionRepository();
    const localStatsRepo = new LocalStorageStatsRepository();

    const supabasePlayersRepo = new SupabasePlayerRepository(client);
    const supabaseSessionsRepo = new SupabaseSessionRepository(client);
    const supabaseStatsRepo = new SupabaseStatsRepository(client);

    // 1. Fetch all local data
    const players = await localPlayersRepo.getPlayers();
    const sessions = await localSessionsRepo.getSessions();
    const stats = await localStatsRepo.getPlayerStats();

    let photosCount = 0;
    for (const s of sessions) {
      if (s.photos) {
        photosCount += s.photos.length;
      }
    }

    // 2. Push players
    if (players.length > 0) {
      await supabasePlayersRepo.savePlayers(players);
    }

    // 3. Push sessions (which saves session_players, rounds, round_scores, results, photos)
    if (sessions.length > 0) {
      for (const session of sessions) {
        await supabaseSessionsRepo.saveSession(session);
      }
    }

    // 4. Push stats
    if (Object.keys(stats).length > 0) {
      await supabaseStatsRepo.savePlayerStats(stats);
    }

    // 5. Verify records exist in Supabase
    const verifiedPlayers = await supabasePlayersRepo.getPlayers();
    const verifiedSessions = await supabaseSessionsRepo.getSessions();

    if (verifiedPlayers.length === 0 && players.length > 0) {
      throw new Error('Verification failed: Players were not saved to Supabase');
    }

    const completedAt = new Date().toISOString();
    if (typeof window !== 'undefined') {
      localStorage.setItem(MIGRATION_FLAG_KEY, completedAt);
    }

    return {
      success: true,
      summary: {
        playersMigrated: players.length,
        sessionsMigrated: sessions.length,
        statsMigrated: Object.keys(stats).length,
        photosMigrated: photosCount,
        completedAt
      }
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Migration] localToSupabase error:', err);
    return {
      success: false,
      error: errorMsg
    };
  }
}
