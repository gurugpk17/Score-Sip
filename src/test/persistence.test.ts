import { LocalStoragePlayerRepository, LocalStorageSessionRepository, LocalStorageStatsRepository, LocalStoragePhotoRepository } from '../lib/repositories/localStorageRepo';
import {
  mapPlayerDbToDomain,
  mapPlayerDomainToDb,
  mapPhotoDbToDomain,
  mapPhotoDomainToDb,
  mapStatsDbToDomain,
  mapStatsDomainToDb,
  assembleSessionDomain
} from '../lib/repositories/mappers';
import { getSupabaseConfig, isSupabaseConfigured } from '../lib/supabase/config';
import { getSupabaseClient } from '../lib/supabase/client';
import { GameSession, Player, PlayerStats, GamePhoto, SessionResult } from '../domain/models/types';
import { PRESET_GAMES } from '../domain/scoring/rules';
import { updatePlayerStatistics } from '../domain/scoring/engine';

export interface TestResult {
  title: string;
  passed: boolean;
  error?: string;
}

// In-memory mock for localStorage in Node/test environments
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

export async function runPersistenceTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  function assert(title: string, condition: boolean, message?: string) {
    results.push({
      title,
      passed: condition,
      error: condition ? undefined : message || 'Assertion failed'
    });
  }

  // Setup localStorage mock if not in browser
  if (typeof window === 'undefined' || !window.localStorage) {
    (globalThis as unknown as { localStorage: MockLocalStorage }).localStorage = new MockLocalStorage();
  } else {
    localStorage.clear();
  }

  try {
    // 1. PlayerRepository: Create and load players
    const playerRepo = new LocalStoragePlayerRepository();
    const initialPlayers = await playerRepo.getPlayers();
    assert('Persistence: Initial players loaded', initialPlayers.length >= 5);

    const newPlayer: Player = {
      id: 'p_test_101',
      name: 'Rohan',
      seatNumber: 6,
      initials: 'R',
      avatarColor: '#10b981'
    };
    await playerRepo.createPlayer(newPlayer);
    const updatedPlayers = await playerRepo.getPlayers();
    assert(
      'Persistence: Create player adds Rohan to roster',
      updatedPlayers.some(p => p.id === 'p_test_101' && p.name === 'Rohan')
    );

    // 2. SessionRepository: Create session, save game, save round score
    const sessionRepo = new LocalStorageSessionRepository();
    const gameConfig = PRESET_GAMES['7s']();
    const testSession: GameSession = {
      id: 'session_test_999',
      name: 'Test Championship Match',
      gameConfig,
      status: 'active',
      players: updatedPlayers.slice(0, 3),
      currentRoundNumber: 1,
      rounds: [
        {
          roundNumber: 1,
          multiplier: 2,
          isCompleted: false,
          scores: {}
        }
      ],
      startedAt: new Date().toISOString(),
      isFinalized: false
    };

    await sessionRepo.saveSession(testSession);
    const retrievedSession = await sessionRepo.getSessionById('session_test_999');
    assert('Persistence: Save and load session', retrievedSession !== null && retrievedSession.name === 'Test Championship Match');

    // 3. Save round score
    await sessionRepo.saveRoundScore('session_test_999', 1, 'p_test_101', {
      playerId: 'p_test_101',
      baseScore: 0,
      multiplier: 2,
      finalScore: 0,
      scoreType: 'dick',
      entered: true
    });
    const sessionWithScore = await sessionRepo.getSessionById('session_test_999');
    assert(
      'Persistence: Save round score persists dick hand (0 pts)',
      sessionWithScore?.rounds[0]?.scores['p_test_101']?.finalScore === 0
    );

    // 4. Session history
    const allSessions = await sessionRepo.getSessions();
    assert('Persistence: Load session history returns sessions', allSessions.length >= 1);

    // 5. Active session ID
    await sessionRepo.setActiveSessionId('session_test_999');
    const activeId = await sessionRepo.getActiveSessionId();
    assert('Persistence: Active session ID persisted', activeId === 'session_test_999');

    // 6. PhotoRepository: Save photo metadata and load
    const photoRepo = new LocalStoragePhotoRepository(sessionRepo);
    const testPhoto: GamePhoto = {
      id: 'snap_test_001',
      sessionId: 'session_test_999',
      gameName: '7s RUMMY',
      sessionName: 'Test Championship Match',
      storagePath: 'https://example.com/test.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      caption: 'Table Flip Moment',
      uploadedAt: new Date().toISOString(),
      likes: 3
    };
    await photoRepo.savePhotoMetadata(testPhoto);
    const sessionPhotos = await photoRepo.getPhotosForSession('session_test_999');
    assert(
      'Persistence: Photo metadata saved to session',
      sessionPhotos.some(p => p.id === 'snap_test_001' && p.caption === 'Table Flip Moment')
    );

    // 7. Delete photo
    await photoRepo.deletePhoto('session_test_999', 'snap_test_001');
    const photosAfterDelete = await photoRepo.getPhotosForSession('session_test_999');
    assert(
      'Persistence: Delete photo removes photo from session',
      !photosAfterDelete.some(p => p.id === 'snap_test_001')
    );

    // 8. StatsRepository: Persistence and idempotency
    const statsRepo = new LocalStorageStatsRepository();
    const initialStats = await statsRepo.getPlayerStats();
    assert('Persistence: Initial player stats loaded', Object.keys(initialStats).length > 0);

    const mockResults: SessionResult[] = [
      {
        sessionId: 'session_test_999',
        playerId: 'p1',
        playerName: 'Guru',
        totalScore: 50,
        finalPosition: 1,
        isWinner: true,
        isRunnerUp: false,
        isTeaDuty: false,
        dickHandsCount: 2,
        bustsCount: 0
      },
      {
        sessionId: 'session_test_999',
        playerId: 'p2',
        playerName: 'Arun',
        totalScore: 120,
        finalPosition: 2,
        isWinner: false,
        isRunnerUp: true,
        isTeaDuty: true,
        dickHandsCount: 0,
        bustsCount: 1
      }
    ];

    const statsBefore = initialStats['p1']?.wins || 0;
    const unfinalizedSession = { ...testSession, isFinalized: false };
    const updatedStats = await statsRepo.updateStatsForSession(initialStats, unfinalizedSession, mockResults);
    assert('Persistence: Stats update increments winner wins', (updatedStats['p1']?.wins || 0) === statsBefore + 1);

    // Idempotency: re-updating with finalized session must not increment again
    const finalizedSession = { ...testSession, isFinalized: true };
    const idempotentStats = await statsRepo.updateStatsForSession(updatedStats, finalizedSession, mockResults);
    assert('Persistence: Idempotency protects finalized session stats', idempotentStats['p1']?.wins === updatedStats['p1']?.wins);

    // 9. Mapper tests: Domain <-> DB
    const playerDbRow = mapPlayerDomainToDb(newPlayer);
    assert('Mappers: Player domain to DB mapping', playerDbRow.name === 'Rohan' && playerDbRow.seat_number === 6);
    const completePlayerRow = {
      id: newPlayer.id,
      name: newPlayer.name,
      seat_number: newPlayer.seatNumber,
      is_host: newPlayer.isHost ?? false,
      avatar_url: newPlayer.avatarUrl ?? null,
      initials: newPlayer.initials,
      avatar_color: newPlayer.avatarColor ?? '#10b981',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const playerDomain = mapPlayerDbToDomain(completePlayerRow);
    assert('Mappers: Player DB to domain mapping', playerDomain.name === 'Rohan' && playerDomain.seatNumber === 6);

    const statsDbRow = mapStatsDomainToDb(updatedStats['p1']);
    assert('Mappers: Stats domain to DB mapping', statsDbRow.player_name === 'Guru');
    const completeStatsRow = {
      player_id: updatedStats['p1'].playerId,
      player_name: updatedStats['p1'].playerName,
      sessions_played: updatedStats['p1'].sessionsPlayed,
      wins: updatedStats['p1'].wins,
      runner_ups: updatedStats['p1'].runnerUps,
      tea_bought: updatedStats['p1'].teaBought,
      average_score: updatedStats['p1'].averageScore,
      best_score: updatedStats['p1'].bestScore,
      worst_score: updatedStats['p1'].worstScore,
      win_ratio: updatedStats['p1'].winRatio,
      recent_results: updatedStats['p1'].recentResults,
      updated_at: new Date().toISOString()
    };
    const statsDomain = mapStatsDbToDomain(completeStatsRow);
    assert('Mappers: Stats DB to domain mapping', statsDomain.playerName === 'Guru');

    const photoDbRow = mapPhotoDomainToDb(testPhoto);
    assert('Mappers: Photo domain to DB mapping', photoDbRow.caption === 'Table Flip Moment');
    const completePhotoRow = {
      id: testPhoto.id,
      session_id: testPhoto.sessionId,
      game_name: testPhoto.gameName,
      session_name: testPhoto.sessionName,
      storage_path: testPhoto.storagePath,
      thumbnail_url: testPhoto.thumbnailUrl ?? null,
      caption: testPhoto.caption,
      sub_caption: testPhoto.subCaption ?? null,
      tag: testPhoto.tag ?? null,
      badge: testPhoto.badge ?? null,
      player_initials: testPhoto.playerInitials ?? [],
      likes: testPhoto.likes ?? 0,
      uploaded_at: testPhoto.uploadedAt,
      uploaded_by: testPhoto.uploadedBy ?? null
    };
    const photoDomain = mapPhotoDbToDomain(completePhotoRow);
    assert('Mappers: Photo DB to domain mapping', photoDomain.caption === 'Table Flip Moment');

    // 10. Safe Supabase client configuration check
    const client = getSupabaseClient();
    const config = getSupabaseConfig();
    assert(
      'Safe Client: Missing env vars do not throw crash, fallback safely',
      client === null || isSupabaseConfigured()
    );
    assert(
      'Safe Config: Reports configuration status accurately',
      typeof config.isConfigured === 'boolean' && typeof config.statusMessage === 'string'
    );
  } catch (err) {
    assert('Persistence tests completed without unhandled exceptions', false, String(err));
  }

  return results;
}
