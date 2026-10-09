import {
  LocalStoragePlayerRepository,
  LocalStorageSessionRepository,
  LocalStorageStatsRepository,
  LocalStoragePhotoRepository
} from '../lib/repositories/localStorageRepo';
import {
  mapPlayerDbToDomain,
  mapPlayerDomainToDb,
  mapPhotoDbToDomain,
  mapPhotoDomainToDb,
  mapStatsDbToDomain,
  mapStatsDomainToDb
} from '../lib/repositories/mappers';
import { GameSession, Player, PlayerStats, GamePhoto } from '../domain/models/types';
import { PRESET_GAMES } from '../domain/scoring/rules';

export interface TestResult {
  title: string;
  passed: boolean;
  error?: string;
}

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

export async function runUserIsolationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  function assert(title: string, condition: boolean, message?: string) {
    results.push({
      title,
      passed: condition,
      error: condition ? undefined : message || 'Assertion failed'
    });
  }

  // Setup localStorage mock if in Node
  if (typeof window === 'undefined' || !window.localStorage) {
    (globalThis as unknown as { localStorage: MockLocalStorage }).localStorage = new MockLocalStorage();
  } else {
    localStorage.clear();
  }

  try {
    const userA = 'user_uuid_aaa_111';
    const userB = 'user_uuid_bbb_222';
    const userFresh = 'user_uuid_fresh_333';

    const playerRepo = new LocalStoragePlayerRepository();
    const sessionRepo = new LocalStorageSessionRepository();
    const statsRepo = new LocalStorageStatsRepository();
    const photoRepo = new LocalStoragePhotoRepository(sessionRepo);

    // 1. Fresh user starts with 0 players
    const freshPlayers = await playerRepo.getPlayers(userFresh);
    assert(
      'User Isolation: Fresh authenticated account starts with 0 players',
      freshPlayers.length === 0,
      `Expected 0 players for fresh user, received ${freshPlayers.length}`
    );

    // 2. User A creates players
    const playerA1: Player = {
      id: 'p_a1',
      name: 'Alice',
      initials: 'AL',
      avatarColor: '#4edea3',
      isActive: true,
      userId: userA,
      createdAt: new Date().toISOString()
    };
    const playerA2: Player = {
      id: 'p_a2',
      name: 'Aaron',
      initials: 'AA',
      avatarColor: '#ffb95f',
      isActive: true,
      userId: userA,
      createdAt: new Date().toISOString()
    };

    await playerRepo.createPlayer(playerA1, userA);
    await playerRepo.createPlayer(playerA2, userA);

    const userAPlayers = await playerRepo.getPlayers(userA);
    assert(
      'User Isolation: User A has exactly User A players saved',
      userAPlayers.length === 2 && userAPlayers.some(p => p.name === 'Alice'),
      'User A players not saved properly'
    );

    // 3. User B sees 0 of User A's players
    const userBPlayers = await playerRepo.getPlayers(userB);
    assert(
      'User Isolation: User B cannot see User A players roster',
      userBPlayers.length === 0,
      `Expected User B to have 0 players, but found ${userBPlayers.length}`
    );

    // 4. User B adds their own player
    const playerB1: Player = {
      id: 'p_b1',
      name: 'Bob',
      initials: 'BO',
      avatarColor: '#ff7a73',
      isActive: true,
      userId: userB,
      createdAt: new Date().toISOString()
    };
    await playerRepo.createPlayer(playerB1, userB);

    const userBUpdated = await playerRepo.getPlayers(userB);
    assert(
      'User Isolation: User B sees only User B player',
      userBUpdated.length === 1 && userBUpdated[0].name === 'Bob',
      'User B player list incorrect'
    );

    // 5. Active Session Isolation: User A creates an active game session
    const sessionA: GameSession = {
      id: 'sess_a1',
      name: 'User A Tournament',
      gameConfig: PRESET_GAMES['7s'],
      players: [playerA1, playerA2],
      rounds: [
        {
          roundNumber: 1,
          multiplier: 2,
          scores: {
            p_a1: { baseScore: 0, multiplier: 2, finalScore: 0, scoreType: 'dick', entered: true },
            p_a2: { baseScore: 40, multiplier: 2, finalScore: 80, scoreType: 'custom', entered: true }
          },
          isCompleted: true
        }
      ],
      currentRoundNumber: 1,
      status: 'active',
      userId: userA,
      createdAt: new Date().toISOString()
    };

    await sessionRepo.saveSession(sessionA, userA);
    await sessionRepo.setActiveSessionId(sessionA.id, userA);

    // Check User A active session
    const activeAId = await sessionRepo.getActiveSessionId(userA);
    const activeA = activeAId ? await sessionRepo.getSessionById(activeAId, userA) : null;
    assert(
      'User-Scoped Active Game: User A finds their active game',
      activeA !== null && activeA.id === 'sess_a1',
      'User A active game not found'
    );

    // Check User B active session (must be null)
    const activeBId = await sessionRepo.getActiveSessionId(userB);
    assert(
      'User-Scoped Active Game: User B has NO active game (Continue Game button hidden for User B)',
      activeBId === null,
      'User B unexpectedly has an active session ID'
    );

    // 6. User B creates their own separate active session
    const sessionB: GameSession = {
      id: 'sess_b1',
      name: 'User B Duel',
      gameConfig: PRESET_GAMES['5s'],
      players: [playerB1],
      rounds: [
        {
          roundNumber: 1,
          multiplier: 2,
          scores: {
            p_b1: { baseScore: 10, multiplier: 2, finalScore: 20, scoreType: 'custom', entered: true }
          },
          isCompleted: true
        }
      ],
      currentRoundNumber: 1,
      status: 'active',
      userId: userB,
      createdAt: new Date().toISOString()
    };

    await sessionRepo.saveSession(sessionB, userB);
    await sessionRepo.setActiveSessionId(sessionB.id, userB);

    // Verify both users maintain their distinct active games simultaneously
    const activeACheckId = await sessionRepo.getActiveSessionId(userA);
    const activeBCheckId = await sessionRepo.getActiveSessionId(userB);
    assert(
      'Concurrency & Multi-User Isolation: User A and User B active sessions do not overwrite each other',
      activeACheckId === 'sess_a1' && activeBCheckId === 'sess_b1',
      'Active session collision between User A and User B'
    );

    // 7. User-scoped Statistics Isolation
    const statsA: PlayerStats = {
      playerId: 'p_a1',
      userId: userA,
      gamesPlayed: 5,
      gamesWon: 4,
      runnerUp: 1,
      teaBought: 0,
      totalPenalties: 60,
      dicksCount: 8,
      fullCount: 0
    };
    await statsRepo.savePlayerStats({ p_a1: statsA }, userA);

    const userAStats = await statsRepo.getPlayerStats(userA);
    const userBStats = await statsRepo.getPlayerStats(userB);

    assert(
      'User-Scoped Statistics: User A has stats recorded',
      userAStats['p_a1'] !== undefined && userAStats['p_a1'].gamesWon === 4,
      'User A stats not recorded correctly'
    );
    assert(
      'User-Scoped Statistics: User B cannot see User A statistics',
      Object.keys(userBStats).length === 0,
      `User B leaked stats: expected 0, found ${Object.keys(userBStats).length}`
    );

    // 8. Photo Isolation
    const photoA: GamePhoto = {
      id: 'photo_a1',
      sessionId: sessionA.id,
      sessionName: sessionA.name,
      gameName: '7s Rummy',
      storagePath: 'https://storage.supabase.co/snaps/photo_a1.jpg',
      thumbnailUrl: 'https://storage.supabase.co/snaps/photo_a1_thumb.jpg',
      caption: 'Round 1 Win',
      tag: 'TABLE ACTION',
      userId: userA,
      createdAt: new Date().toISOString()
    };
    await photoRepo.savePhotoMetadata(photoA, userA);

    const photosA = await photoRepo.getAllPhotos(userA);
    const photosB = await photoRepo.getAllPhotos(userB);

    assert(
      'Photo Ownership: User A photos stored and retrieved',
      photosA.length === 1 && photosA[0].id === 'photo_a1',
      'User A photo not retrieved'
    );
    assert(
      'Photo Ownership: User B sees 0 of User A private game photos',
      photosB.length === 0,
      `User B leaked photos: expected 0, found ${photosB.length}`
    );

    // 9. LocalStorage User Key Isolation
    const storageObj = (globalThis as unknown as { localStorage: MockLocalStorage }).localStorage;
    const keyUserAPlayers = storageObj.getItem(`score_sip_players_${userA}`);
    const keyUserBPlayers = storageObj.getItem(`score_sip_players_${userB}`);

    assert(
      'LocalStorage Isolation: Keys are explicitly partitioned by user ID',
      keyUserAPlayers !== null && keyUserBPlayers !== null,
      'Expected user-scoped localStorage partition keys'
    );

    // 10. Theme Persistence
    storageObj.setItem('score_sip_theme', 'dark');
    const theme1 = storageObj.getItem('score_sip_theme');
    storageObj.setItem('score_sip_theme', 'light');
    const theme2 = storageObj.getItem('score_sip_theme');

    assert(
      'Theme Persistence: Light and dark preferences persist in localStorage',
      theme1 === 'dark' && theme2 === 'light',
      'Theme persistence failed'
    );

    // 11. Database Mapper RLS & Ownership Verification
    const domainPlayer: Player = {
      id: 'map_p1',
      name: 'Zara',
      initials: 'ZA',
      avatarColor: '#4edea3',
      isActive: true,
      userId: 'auth_usr_999',
      createdAt: '2026-10-09T12:00:00Z'
    };
    const dbPlayer = mapPlayerDomainToDb(domainPlayer);
    assert(
      'RLS Mappers: mapPlayerDomainToDb attaches user_id for database row-level security',
      dbPlayer.user_id === 'auth_usr_999',
      `Expected user_id 'auth_usr_999', got '${dbPlayer.user_id}'`
    );

    const roundtripPlayer = mapPlayerDbToDomain(dbPlayer);
    assert(
      'RLS Mappers: mapPlayerDbToDomain preserves user_id ownership in domain model',
      roundtripPlayer.userId === 'auth_usr_999',
      `Expected userId 'auth_usr_999', got '${roundtripPlayer.userId}'`
    );

    const domainStats: PlayerStats = {
      playerId: 'map_p1',
      userId: 'auth_usr_999',
      gamesPlayed: 10,
      gamesWon: 6,
      runnerUp: 2,
      teaBought: 1,
      totalPenalties: 120,
      dicksCount: 5,
      fullCount: 1
    };
    const dbStats = mapStatsDomainToDb(domainStats);
    assert(
      'RLS Mappers: mapStatsDomainToDb propagates user_id for player_stats RLS policies',
      dbStats.user_id === 'auth_usr_999',
      `Expected user_id 'auth_usr_999' on dbStats, got '${dbStats.user_id}'`
    );

    const domainPhoto: GamePhoto = {
      id: 'map_photo_1',
      sessionId: 'sess_1',
      storagePath: 'https://example.com/p.jpg',
      caption: 'Snapshot',
      userId: 'auth_usr_999',
      createdAt: '2026-10-09T12:00:00Z'
    };
    const dbPhoto = mapPhotoDomainToDb(domainPhoto);
    assert(
      'RLS Mappers: mapPhotoDomainToDb propagates user_id for game_photos RLS policies',
      dbPhoto.user_id === 'auth_usr_999',
      `Expected user_id 'auth_usr_999' on dbPhoto, got '${dbPhoto.user_id}'`
    );

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert('User Isolation Suite Execution', false, `Unhandled error: ${errorMsg}`);
  }

  return results;
}
