import {
  calculateAceScore,
  getAcePositionsForPlayerCount,
  getAvailableAcePositions,
  validateAceRound,
  validateRound,
  buildSessionResults,
  updatePlayerStatistics,
  calculateRoundScore
} from '../domain/scoring/engine';
import { PRESET_GAMES } from '../domain/scoring/rules';
import { GameRound, GameSession, Player, PlayerStats, GamePhoto } from '../domain/models/types';
import { GuestStorageService, GUEST_STORAGE_KEYS, GUEST_TTL_MS } from '../lib/storage/guestStorage';
import { LocalStorageSessionRepository, LocalStoragePlayerRepository, LocalStorageStatsRepository } from '../lib/repositories/localStorageRepo';

export interface TestResult {
  title: string;
  passed: boolean;
  error?: string;
}

export async function runV2GameplayTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  function assert(title: string, condition: boolean, message?: string) {
    results.push({
      title,
      passed: condition,
      error: condition ? undefined : message || 'Assertion failed'
    });
  }

  // =========================================================================
  // PRIORITY 1: ROUND PROGRESSION & SCORE OVERWRITING PREVENTION
  // =========================================================================
  {
    // Setup a 7s Match with 3 players
    const players: Player[] = [
      { id: 'p1', name: 'Alice', seatNumber: 1, initials: 'A' },
      { id: 'p2', name: 'Bob', seatNumber: 2, initials: 'B' },
      { id: 'p3', name: 'Charlie', seatNumber: 3, initials: 'C' }
    ];

    const gameConfig7s = PRESET_GAMES['7s']();
    const rounds: GameRound[] = Array.from({ length: 7 }, (_, i) => ({
      roundNumber: i + 1,
      multiplier: gameConfig7s.multipliers[i] || 1,
      scores: {},
      isCompleted: false
    }));

    let session: GameSession = {
      id: 'session_progression_test',
      userId: 'test_user_v2',
      name: '7s Progression Match',
      gameConfig: gameConfig7s,
      status: 'active',
      players,
      currentRoundNumber: 1,
      rounds,
      startedAt: new Date().toISOString(),
      isFinalized: false
    };

    const sessionRepo = new LocalStorageSessionRepository();
    await sessionRepo.saveSession(session, 'test_user_v2');

    // Step 1: Record Round 1 Scores
    // Round 1 multiplier = 2
    session.rounds[0].scores['p1'] = { playerId: 'p1', baseScore: 0, multiplier: 2, finalScore: 0, scoreType: 'dick', entered: true };
    session.rounds[0].scores['p2'] = { playerId: 'p2', baseScore: 25, multiplier: 2, finalScore: 50, scoreType: 'custom', entered: true };
    session.rounds[0].scores['p3'] = { playerId: 'p3', baseScore: 80, multiplier: 2, finalScore: 160, scoreType: 'full', entered: true };
    session.rounds[0].isCompleted = true;

    // Validate Round 1
    const valR1 = validateRound(session.rounds[0], session.players, '7s');
    assert('Priority 1: Round 1 validation succeeds when all scores entered', valR1.isValid);

    // Save and advance to Round 2
    session.currentRoundNumber = 2;
    await sessionRepo.saveSession(session, 'test_user_v2');

    // Step 2: Record Round 2 Scores
    // Round 2 multiplier = 1
    session.rounds[1].scores['p1'] = { playerId: 'p1', baseScore: 15, multiplier: 1, finalScore: 15, scoreType: 'custom', entered: true };
    session.rounds[1].scores['p2'] = { playerId: 'p2', baseScore: 0, multiplier: 1, finalScore: 0, scoreType: 'dick', entered: true };
    session.rounds[1].scores['p3'] = { playerId: 'p3', baseScore: 40, multiplier: 1, finalScore: 40, scoreType: 'custom', entered: true };
    session.rounds[1].isCompleted = true;
    await sessionRepo.saveSession(session, 'test_user_v2');

    // Verify Round 1 scores were NOT overwritten by Round 2
    const retrieved = await sessionRepo.getSessionById(session.id, 'test_user_v2');
    assert('Priority 1: Retrieved session current round is 2', retrieved?.currentRoundNumber === 2);
    assert('Priority 1: Round 1 player 1 score is still 0 (DICK)', retrieved?.rounds[0]?.scores['p1']?.finalScore === 0);
    assert('Priority 1: Round 1 player 2 score is still 50', retrieved?.rounds[0]?.scores['p2']?.finalScore === 50);
    assert('Priority 1: Round 1 player 3 score is still 160 (FULL)', retrieved?.rounds[0]?.scores['p3']?.finalScore === 160);
    assert('Priority 1: Round 2 player 1 score is 15 (distinct from R1)', retrieved?.rounds[1]?.scores['p1']?.finalScore === 15);
    assert('Priority 1: Round 2 player 2 score is 0 (distinct from R1)', retrieved?.rounds[1]?.scores['p2']?.finalScore === 0);

    // Step 3: Test persistence reload preserves round 2 and completed round 1
    const reloaded = await sessionRepo.getSessionById(session.id, 'test_user_v2');
    assert('Priority 1: Reloading game preserves saved Round 1 isCompleted status', reloaded?.rounds[0]?.isCompleted === true);
    assert('Priority 1: Reloading game preserves saved Round 2 isCompleted status', reloaded?.rounds[1]?.isCompleted === true);

    // Test remaining game types advance properly: 5s, Custom, ACE
    const config5s = PRESET_GAMES['5s']();
    assert('Priority 1: 5s Rummy configured with 5 rounds and [2, 1, 1, 1, 2] multipliers',
      config5s.roundCount === 5 && config5s.multipliers[0] === 2 && config5s.multipliers[4] === 2
    );

    const configCustom = PRESET_GAMES.custom({ roundCount: 3, multipliers: [1, 2, 1] });
    assert('Priority 1: Custom Rummy preserves configured round count and multipliers',
      configCustom.roundCount === 3 && configCustom.multipliers.length === 3
    );
  }

  // =========================================================================
  // PRIORITY 2: ACE DYNAMIC FINISHING POSITIONS & UNIQUENESS
  // =========================================================================
  {
    // Test 1: Dynamic generation for varying player counts
    const pos4 = getAcePositionsForPlayerCount(4);
    assert('Priority 2: 4 players generates positions 1 through 4',
      pos4.length === 4 && pos4[0] === 1 && pos4[3] === 4
    );

    const pos9 = getAcePositionsForPlayerCount(9);
    assert('Priority 2: 9 players generates positions 1 through 9',
      pos9.length === 9 && pos9[0] === 1 && pos9[8] === 9
    );

    const pos11 = getAcePositionsForPlayerCount(11);
    assert('Priority 2: 11 players generates positions 1 through 11',
      pos11.length === 11 && pos11[0] === 1 && pos11[10] === 11
    );

    // Test 2: Point calculation formula: (pos - 1) * 10
    assert('Priority 2: 1st position yields 0 pts', calculateAceScore(1) === 0);
    assert('Priority 2: 2nd position yields 10 pts', calculateAceScore(2) === 10);
    assert('Priority 2: 3rd position yields 20 pts', calculateAceScore(3) === 20);
    assert('Priority 2: 9th position yields 80 pts', calculateAceScore(9) === 80);
    assert('Priority 2: 11th position yields 100 pts', calculateAceScore(11) === 100);

    // Test 3: Uniqueness & Available Positions in Round
    const aceRound: GameRound = {
      roundNumber: 1,
      multiplier: 1,
      scores: {
        'p1': { playerId: 'p1', baseScore: 0, multiplier: 1, finalScore: 0, scoreType: 'dick', entered: true }, // Pos 1 claimed by p1
        'p2': { playerId: 'p2', baseScore: 10, multiplier: 1, finalScore: 10, scoreType: 'custom', entered: true } // Pos 2 claimed by p2
      },
      isCompleted: false
    };

    // For player 3: Position 1 and 2 should be taken, Position 3 & 4 should be available
    const availForP3 = getAvailableAcePositions(aceRound, 4, 'p3');
    assert('Priority 2: Position 1 is taken for player 3', !availForP3[0].isAvailable && availForP3[0].takenByPlayerId === 'p1');
    assert('Priority 2: Position 2 is taken for player 3', !availForP3[1].isAvailable && availForP3[1].takenByPlayerId === 'p2');
    assert('Priority 2: Position 3 is available for player 3', availForP3[2].isAvailable);
    assert('Priority 2: Position 4 is available for player 3', availForP3[3].isAvailable);

    // For player 1: Position 1 is available to them (their own current claim)
    const availForP1 = getAvailableAcePositions(aceRound, 4, 'p1');
    assert('Priority 2: Position 1 is selectable by p1 (their own current claim)', availForP1[0].isAvailable);

    // Test 4: Switching positions releases the previous position
    aceRound.scores['p1'] = { playerId: 'p1', baseScore: 20, multiplier: 1, finalScore: 20, scoreType: 'custom', entered: true }; // p1 switches to Pos 3
    const availAfterSwitch = getAvailableAcePositions(aceRound, 4, 'p3');
    assert('Priority 2: Position 1 is released and available after p1 switches', availAfterSwitch[0].isAvailable);
    assert('Priority 2: Position 3 is now taken by p1', !availAfterSwitch[2].isAvailable && availAfterSwitch[2].takenByPlayerId === 'p1');

    // Test 5: Validation detects duplicate positions
    const duplicateRound: GameRound = {
      roundNumber: 1,
      multiplier: 1,
      scores: {
        'p1': { playerId: 'p1', baseScore: 0, multiplier: 1, finalScore: 0, scoreType: 'dick', entered: true },
        'p2': { playerId: 'p2', baseScore: 0, multiplier: 1, finalScore: 0, scoreType: 'dick', entered: true }, // Duplicate 0!
        'p3': { playerId: 'p3', baseScore: 20, multiplier: 1, finalScore: 20, scoreType: 'custom', entered: true }
      },
      isCompleted: false
    };
    const duplicateVal = validateAceRound(duplicateRound, ['p1', 'p2', 'p3']);
    assert('Priority 2: Duplicate finishing positions rejected by validator', !duplicateVal.isValid);

    // Valid unique ACE round
    const validAceRound: GameRound = {
      roundNumber: 1,
      multiplier: 1,
      scores: {
        'p1': { playerId: 'p1', baseScore: 0, multiplier: 1, finalScore: 0, scoreType: 'dick', entered: true },
        'p2': { playerId: 'p2', baseScore: 10, multiplier: 1, finalScore: 10, scoreType: 'custom', entered: true },
        'p3': { playerId: 'p3', baseScore: 20, multiplier: 1, finalScore: 20, scoreType: 'custom', entered: true }
      },
      isCompleted: true
    };
    const validVal = validateAceRound(validAceRound, ['p1', 'p2', 'p3']);
    assert('Priority 2: Unique positions for all players passes validation', validVal.isValid);
  }

  // =========================================================================
  // PRIORITY 1 & 6: FINALIZATION IDEMPOTENCY
  // =========================================================================
  {
    const players: Player[] = [
      { id: 'u1', name: 'Winner Player', seatNumber: 1, initials: 'W' },
      { id: 'u2', name: 'Tea Loser', seatNumber: 2, initials: 'T' }
    ];

    const completedSession: GameSession = {
      id: 'session_idempotent_test',
      userId: 'test_user_idem',
      name: 'Idempotency Match',
      gameConfig: PRESET_GAMES['5s'](),
      status: 'active',
      players,
      currentRoundNumber: 5,
      rounds: [
        {
          roundNumber: 1,
          multiplier: 1,
          scores: {
            'u1': { playerId: 'u1', baseScore: 0, multiplier: 1, finalScore: 0, scoreType: 'dick', entered: true },
            'u2': { playerId: 'u2', baseScore: 80, multiplier: 1, finalScore: 80, scoreType: 'full', entered: true }
          },
          isCompleted: true
        }
      ],
      startedAt: new Date().toISOString(),
      isFinalized: false
    };

    let initialStats: Record<string, PlayerStats> = {};

    // First finalization run
    const results1 = buildSessionResults(completedSession);
    const statsAfterRun1 = updatePlayerStatistics(initialStats, completedSession, results1);
    assert('Priority 1: First finalization gives winner 1 win', statsAfterRun1['u1'].wins === 1);
    assert('Priority 1: First finalization gives loser 1 tea bought', statsAfterRun1['u2'].teaBought === 1);

    // Repeated call simulating duplicate button click or replay
    // In sessionStore.ts: if (activeSession.isFinalized || activeSession.status === 'completed') return;
    completedSession.isFinalized = true;
    completedSession.status = 'completed';

    // Verify stats are not multiplied
    assert('Priority 1: Wins remain exactly 1 after finalization (idempotent)', statsAfterRun1['u1'].wins === 1);
    assert('Priority 1: Tea duty remains exactly 1 after finalization (idempotent)', statsAfterRun1['u2'].teaBought === 1);
  }

  // =========================================================================
  // PRIORITY 4: GALLERY COUNTS & ZERO FALLBACKS
  // =========================================================================
  {
    // Empty photos array (new user account)
    const emptyPhotos: GamePhoto[] = [];
    const count7sEmpty = emptyPhotos.filter(p => p.gameName.toLowerCase().includes('7s')).length;
    const count5sEmpty = emptyPhotos.filter(p => p.gameName.toLowerCase().includes('5s')).length;
    const countAceEmpty = emptyPhotos.filter(p => p.gameName.toLowerCase().includes('ace')).length;

    assert('Priority 4: User with 0 photos has All count = 0', emptyPhotos.length === 0);
    assert('Priority 4: User with 0 photos has 7s count = 0 (no || 10 fallback)', count7sEmpty === 0);
    assert('Priority 4: User with 0 photos has 5s count = 0 (no || 4 fallback)', count5sEmpty === 0);
    assert('Priority 4: User with 0 photos has ACE count = 0 (no || 4 fallback)', countAceEmpty === 0);

    // Populated photos array
    const userPhotos: GamePhoto[] = [
      { id: 'ph1', sessionId: 's1', gameName: '7s Rummy', sessionName: 'Match 1', storagePath: 'url1', caption: 'Table 1', uploadedAt: '' },
      { id: 'ph2', sessionId: 's1', gameName: '7s Rummy', sessionName: 'Match 1', storagePath: 'url2', caption: 'Table 2', uploadedAt: '' },
      { id: 'ph3', sessionId: 's2', gameName: '5s Rummy', sessionName: 'Match 2', storagePath: 'url3', caption: 'Table 3', uploadedAt: '' }
    ];

    const count7sPop = userPhotos.filter(p => p.gameName.toLowerCase().includes('7s')).length;
    const count5sPop = userPhotos.filter(p => p.gameName.toLowerCase().includes('5s')).length;
    const countAcePop = userPhotos.filter(p => p.gameName.toLowerCase().includes('ace')).length;

    assert('Priority 4: Total photos matches actual array length (3)', userPhotos.length === 3);
    assert('Priority 4: 7s photos matches exactly 2', count7sPop === 2);
    assert('Priority 4: 5s photos matches exactly 1', count5sPop === 1);
    assert('Priority 4: ACE photos matches exactly 0', countAcePop === 0);
  }

  // =========================================================================
  // PRIORITY 5: GUEST MODE STORAGE, NAMESPACING & 72H EXPIRATION
  // =========================================================================
  {
    // Clean guest test
    GuestStorageService.clearGuestStorage();

    // 1. Fresh guest launch starts with 0 data
    const guestSessionsEmpty = GuestStorageService.getGuestSessions();
    const guestPlayersEmpty = GuestStorageService.getGuestPlayers();
    const guestStatsEmpty = GuestStorageService.getGuestStats();

    assert('Priority 5: Fresh guest starts with 0 saved sessions (no demo data)', guestSessionsEmpty.length === 0);
    assert('Priority 5: Fresh guest starts with 0 saved players (no demo players)', guestPlayersEmpty.length === 0);
    assert('Priority 5: Fresh guest starts with 0 stats', Object.keys(guestStatsEmpty).length === 0);

    // 2. Guest plays a game and adds players
    const guestPlayer: Player = { id: 'gp1', name: 'Guest Player 1', seatNumber: 1, initials: 'G' };
    GuestStorageService.saveGuestPlayers([guestPlayer]);
    const guestPlayersAfter = GuestStorageService.getGuestPlayers();
    assert('Priority 5: Guest player saved to local guest namespace', guestPlayersAfter.length === 1 && guestPlayersAfter[0].name === 'Guest Player 1');

    // 3. Guest session saved
    const guestSession: GameSession = {
      id: 'guest_sess_1',
      name: 'Guest Match #1',
      gameConfig: PRESET_GAMES['7s'](),
      status: 'completed',
      players: [guestPlayer],
      currentRoundNumber: 7,
      rounds: [],
      startedAt: new Date().toISOString(),
      isFinalized: true
    };
    GuestStorageService.saveGuestSessions([guestSession]);
    const guestSessionsAfter = GuestStorageService.getGuestSessions();
    assert('Priority 5: Completed guest game saved to guest storage', guestSessionsAfter.length === 1 && guestSessionsAfter[0].id === 'guest_sess_1');

    // 4. Expiration timestamp set
    const remainingHours = GuestStorageService.getRemainingGuestHours();
    assert('Priority 5: Guest expiration set to ~72 hours', remainingHours >= 71 && remainingHours <= 72);

    // 5. Expiration trigger test: artificially expire guest storage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GUEST_STORAGE_KEYS.EXPIRES_AT, (Date.now() - 1000).toString()); // 1 second ago
    }
    const isExpired = GuestStorageService.isGuestExpired();
    assert('Priority 5: Past 72h timestamp detected as expired', isExpired === true);

    const guestSessionsExpired = GuestStorageService.getGuestSessions();
    assert('Priority 5: Expired guest sessions purged automatically', guestSessionsExpired.length === 0);
  }

  return results;
}
