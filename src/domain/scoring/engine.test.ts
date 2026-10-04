import {
  calculateAceScore,
  calculateRoundScore,
  calculateGameTotal,
  calculateRanking,
  calculateTeaDutyPlayers,
  updatePlayerStatistics,
  buildSessionResults
} from './engine';
import { PRESET_GAMES } from './rules';
import { GameSession, PlayerStats } from '../models/types';

export interface TestResult {
  title: string;
  passed: boolean;
  error?: string;
}

export function runAllScoringEngineTests(): TestResult[] {
  const results: TestResult[] = [];

  function assert(title: string, condition: boolean, message?: string) {
    results.push({
      title,
      passed: condition,
      error: condition ? undefined : message || 'Assertion failed'
    });
  }

  // 1. ACE scoring tests
  assert("ACE: 1st position yields 0", calculateAceScore(1) === 0);
  assert("ACE: 2nd position yields 10", calculateAceScore(2) === 10);
  assert("ACE: 3rd position yields 20", calculateAceScore(3) === 20);
  assert("ACE: 4th position yields 30", calculateAceScore(4) === 30);
  assert("ACE: 5th position yields 40", calculateAceScore(5) === 40);

  // 2. 7s Rummy Multipliers
  const game7s = PRESET_GAMES['7s']();
  assert("7s: Has 7 rounds", game7s.roundCount === 7);
  assert("7s: Round 1 multiplier is 2", game7s.multipliers[0] === 2);
  assert("7s: Round 7 multiplier is 2", game7s.multipliers[6] === 2);
  assert("7s: Middle rounds (R2-R6) multiplier is 1", 
    game7s.multipliers.slice(1, 6).every(m => m === 1)
  );

  // 3. 5s Rummy Multipliers
  const game5s = PRESET_GAMES['5s']();
  assert("5s: Has 5 rounds", game5s.roundCount === 5);
  assert("5s: Round 1 multiplier is 2", game5s.multipliers[0] === 2);
  assert("5s: Round 5 multiplier is 2", game5s.multipliers[4] === 2);
  assert("5s: Middle rounds (R2-R4) multiplier is 1", 
    game5s.multipliers.slice(1, 4).every(m => m === 1)
  );

  // 4. Custom Rummy configuration
  const customRummy = PRESET_GAMES['custom']({
    name: "Night Owls Rummy",
    roundCount: 4,
    multipliers: [3, 1, 1, 3],
    fullPenaltyValue: 100
  });
  assert("Custom: round count is 4", customRummy.roundCount === 4);
  assert("Custom: multipliers match [3, 1, 1, 3]", 
    JSON.stringify(customRummy.multipliers) === JSON.stringify([3, 1, 1, 3])
  );
  assert("Custom: full penalty is 100", customRummy.fullPenaltyValue === 100);

  // 5. Round score calculation
  assert("Round score: DICK 0 * 2 = 0", calculateRoundScore(0, 2) === 0);
  assert("Round score: 35 * 2 = 70", calculateRoundScore(35, 2) === 70);
  assert("Round score: 42 * 1 = 42", calculateRoundScore(42, 1) === 42);
  assert("Round score: FULL 80 * 2 = 160", calculateRoundScore(80, 2) === 160);

  // 6. Game total calculation
  assert("Game total sums all scores correctly", 
    calculateGameTotal([0, 16, 24, 70, 32]) === 142
  );

  // 7. Ranking (Lowest score wins, second lowest runner-up, highest loser)
  const ranking1 = calculateRanking([
    { playerId: 'p1', totalScore: 142 }, // lowest -> winner
    { playerId: 'p2', totalScore: 158 }, // runner-up
    { playerId: 'p3', totalScore: 172 },
    { playerId: 'p4', totalScore: 203 }  // highest -> loser
  ]);
  assert("Ranking: Lowest total (142) is winner (rank 1)", ranking1[0].playerId === 'p1' && ranking1[0].isWinner);
  assert("Ranking: Second lowest (158) is runner-up (rank 2)", ranking1[1].playerId === 'p2' && ranking1[1].isRunnerUp);
  assert("Ranking: Highest total (203) is loser", ranking1[3].playerId === 'p4' && ranking1[3].isLoser);

  // 8. Tie cases for Tea Duty
  const singleLoser = calculateTeaDutyPlayers([
    { playerId: 'p1', totalScore: 100 },
    { playerId: 'p2', totalScore: 120 },
    { playerId: 'p3', totalScore: 200 }
  ]);
  assert("Tea: Single highest score player gets tea duty", 
    singleLoser.length === 1 && singleLoser[0] === 'p3'
  );

  const twoTiedLosers = calculateTeaDutyPlayers([
    { playerId: 'p1', totalScore: 100 },
    { playerId: 'p2', totalScore: 200 },
    { playerId: 'p3', totalScore: 200 }
  ]);
  assert("Tea: Two tied highest score players BOTH get tea duty", 
    twoTiedLosers.length === 2 && twoTiedLosers.includes('p2') && twoTiedLosers.includes('p3')
  );

  const threeTiedLosers = calculateTeaDutyPlayers([
    { playerId: 'p1', totalScore: 200 },
    { playerId: 'p2', totalScore: 200 },
    { playerId: 'p3', totalScore: 200 }
  ]);
  assert("Tea: Three tied highest score players ALL get tea duty", 
    threeTiedLosers.length === 3
  );

  // 9. Statistics update & idempotency (cannot double-count)
  const dummySession: GameSession = {
    id: 'session-1',
    name: 'Friday Night Brawl',
    gameConfig: game7s,
    status: 'completed',
    players: [
      { id: 'g', name: 'Guru', seatNumber: 1, initials: 'G' },
      { id: 's', name: 'Suresh', seatNumber: 2, initials: 'S' }
    ],
    currentRoundNumber: 7,
    rounds: [],
    startedAt: '2026-10-04T10:00:00Z',
    isFinalized: false
  };

  const resultsMock = [
    {
      sessionId: 'session-1',
      playerId: 'g',
      playerName: 'Guru',
      totalScore: 142,
      finalPosition: 1,
      isWinner: true,
      isRunnerUp: false,
      isTeaDuty: false,
      dickHandsCount: 2,
      bustsCount: 0
    },
    {
      sessionId: 'session-1',
      playerId: 's',
      playerName: 'Suresh',
      totalScore: 203,
      finalPosition: 2,
      isWinner: false,
      isRunnerUp: true,
      isTeaDuty: true,
      dickHandsCount: 0,
      bustsCount: 2
    }
  ];

  const initialStats: Record<string, PlayerStats> = {};
  const statsAfterFirstFinalize = updatePlayerStatistics(initialStats, dummySession, resultsMock);
  
  assert("Stats: Guru wins incremented to 1", statsAfterFirstFinalize['g'].wins === 1);
  assert("Stats: Suresh teaBought incremented to 1", statsAfterFirstFinalize['s'].teaBought === 1);
  assert("Stats: Suresh sessionsPlayed incremented to 1", statsAfterFirstFinalize['s'].sessionsPlayed === 1);

  // Mark session as finalized
  dummySession.isFinalized = true;
  const statsAfterReopening = updatePlayerStatistics(statsAfterFirstFinalize, dummySession, resultsMock);
  assert("Stats Idempotency: Reopening finalized session does not increment wins", 
    statsAfterReopening['g'].wins === 1
  );
  assert("Stats Idempotency: Reopening finalized session does not increment teaBought", 
    statsAfterReopening['s'].teaBought === 1
  );

  // 10. Multi-digit Calculator Score Entry Test Cases (Section 13)
  const testEntering8 = simulateScoreKeypadInput(0, 'dick', ['8']);
  assert("Score Input: Entering 8 -> 8", testEntering8.score === 8 && testEntering8.type === 'custom');

  const testEntering89 = simulateScoreKeypadInput(0, 'dick', ['8', '9']);
  assert("Score Input: Entering 9 after 8 -> 89 (No 80 cap)", testEntering89.score === 89 && testEntering89.type === 'custom');

  const testEntering234 = simulateScoreKeypadInput(0, 'dick', ['2', '3', '4']);
  assert("Score Input: Entering 2, 3, 4 -> 234", testEntering234.score === 234 && testEntering234.type === 'custom');

  const testEntering100 = simulateScoreKeypadInput(0, 'dick', ['1', '0', '0']);
  assert("Score Input: Entering 1, 0, 0 -> 100", testEntering100.score === 100 && testEntering100.type === 'custom');

  const testEntering899 = simulateScoreKeypadInput(0, 'dick', ['8', '9', '9']);
  assert("Score Input: Entering 8, 9, 9 -> 899", testEntering899.score === 899 && testEntering899.type === 'custom');

  const testBackspaceFrom234 = simulateScoreKeypadInput(234, 'custom', ['backspace']);
  assert("Score Input: Backspace from 234 -> 23", testBackspaceFrom234.score === 23);

  const testBackspaceAgain = simulateScoreKeypadInput(23, 'custom', ['backspace']);
  assert("Score Input: Backspace again -> 2", testBackspaceAgain.score === 2);

  const testBackspaceToZero = simulateScoreKeypadInput(2, 'custom', ['backspace']);
  assert("Score Input: Backspace from single digit -> 0", testBackspaceToZero.score === 0 && testBackspaceToZero.type === 'dick');

  const testDickShortcut = simulateScoreKeypadInput(75, 'custom', ['dick']);
  assert("Score Input: DICK shortcut -> 0", testDickShortcut.score === 0 && testDickShortcut.type === 'dick');

  const testFullShortcut = simulateScoreKeypadInput(0, 'dick', ['full'], 80);
  assert("Score Input: FULL shortcut -> 80", testFullShortcut.score === 80 && testFullShortcut.type === 'full');

  const testEntering89AfterFull = simulateScoreKeypadInput(0, 'dick', ['full', '8', '9'], 80);
  assert("Score Input: Entering 89 after FULL -> 89", testEntering89AfterFull.score === 89 && testEntering89AfterFull.type === 'custom');

  const testEntering234AfterFull = simulateScoreKeypadInput(0, 'dick', ['full', '2', '3', '4'], 80);
  assert("Score Input: Entering 234 after FULL -> 234", testEntering234AfterFull.score === 234 && testEntering234.type === 'custom');

  const testLargeScores = simulateScoreKeypadInput(0, 'dick', ['1', '0', '0', '0']);
  assert("Score Input: Arbitrary positive integer 1000 works", testLargeScores.score === 1000);

  return results;
}

export function simulateScoreKeypadInput(
  initialScore: number,
  initialType: 'custom' | 'dick' | 'full',
  actions: ('full' | 'dick' | 'backspace' | 'clear' | string)[],
  configuredFull = 80
): { score: number; type: 'custom' | 'dick' | 'full' } {
  let score = initialScore;
  let type = initialType;

  for (const action of actions) {
    if (action === 'dick') {
      score = 0;
      type = 'dick';
    } else if (action === 'full') {
      score = configuredFull;
      type = 'full';
    } else if (action === 'clear') {
      score = 0;
      type = 'dick';
    } else if (action === 'backspace') {
      const str = score.toString();
      score = str.length > 1 ? parseInt(str.slice(0, -1), 10) : 0;
      type = score === 0 ? 'dick' : score === configuredFull ? 'full' : 'custom';
    } else if (/^[0-9]$/.test(action)) {
      let newStr: string;
      if (type === 'full' || score === 0) {
        newStr = action;
      } else {
        newStr = score.toString() + action;
      }
      score = parseInt(newStr, 10);
      type = score === 0 ? 'dick' : score === configuredFull ? 'full' : 'custom';
    }
  }

  return { score, type };
}
