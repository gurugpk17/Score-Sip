import { GameRound, GameSession, PlayerStats, SessionResult } from '../models/types';

/**
 * ACE card game scoring:
 * 1st position = 0
 * 2nd position = 10
 * 3rd position = 20
 * 4th position = 30
 * 5th position = 40
 * Formula: (position - 1) * 10
 */
export function calculateAceScore(position: number): number {
  if (position <= 1) return 0;
  return (position - 1) * 10;
}

export interface AcePositionOption {
  position: number;
  points: number;
  isAvailable: boolean;
  takenByPlayerId?: string;
}

/**
 * Generate dynamic ACE finishing positions for any player count.
 * Dynamic positions: 1 through playerCount (e.g. 4 -> 1..4, 9 -> 1..9, 11 -> 1..11).
 * Points formula: (position - 1) * 10
 */
export function getAcePositionsForPlayerCount(playerCount: number): number[] {
  const count = Math.max(1, playerCount);
  return Array.from({ length: count }, (_, i) => i + 1);
}

/**
 * Determine which ACE positions are available vs taken in a round.
 * Uniqueness rule: Each position can belong to only one player per round.
 */
export function getAvailableAcePositions(
  round: GameRound,
  playerCount: number,
  currentPlayerId?: string
): AcePositionOption[] {
  const positions = getAcePositionsForPlayerCount(playerCount);
  
  // Map score to player who claimed it in this round
  const scoreClaimants: Record<number, string> = {};
  for (const [pId, score] of Object.entries(round.scores || {})) {
    if (score && score.entered) {
      scoreClaimants[score.baseScore] = pId;
    }
  }

  return positions.map(pos => {
    const points = calculateAceScore(pos);
    const claimedBy = scoreClaimants[points];
    const isCurrentPlayerClaim = Boolean(currentPlayerId && claimedBy === currentPlayerId);
    const isAvailable = !claimedBy || isCurrentPlayerClaim;

    return {
      position: pos,
      points,
      isAvailable,
      takenByPlayerId: claimedBy
    };
  });
}

/**
 * Validates that an ACE round has all unique positions from 1 to N.
 */
export function validateAceRound(
  round: GameRound,
  playerIds: string[]
): { isValid: boolean; error?: string } {
  if (playerIds.length === 0) {
    return { isValid: false, error: 'No players in game' };
  }

  const enteredScores: number[] = [];
  for (const pId of playerIds) {
    const score = round.scores[pId];
    if (!score || !score.entered) {
      return { isValid: false, error: 'Every player must select a finishing position.' };
    }
    enteredScores.push(score.baseScore);
  }

  // Check uniqueness
  const uniqueScores = new Set(enteredScores);
  if (uniqueScores.size !== playerIds.length) {
    return { isValid: false, error: 'Each ACE finishing position must be unique. No duplicate positions allowed.' };
  }

  // Check valid positions
  const expectedScores = new Set(
    getAcePositionsForPlayerCount(playerIds.length).map(pos => calculateAceScore(pos))
  );
  for (const s of enteredScores) {
    if (!expectedScores.has(s)) {
      return { isValid: false, error: `Invalid position score: ${s}` };
    }
  }

  return { isValid: true };
}

/**
 * General round validator for all game variants.
 */
export function validateRound(
  round: GameRound,
  players: { id: string; name: string }[],
  variant: string
): { isValid: boolean; error?: string } {
  const playerIds = players.map(p => p.id);

  if (variant === 'ace') {
    return validateAceRound(round, playerIds);
  }

  // For Rummy variants: all players must have an entered score
  const missing = players.filter(p => !round.scores[p.id]?.entered);
  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Waiting for scores: ${missing.map(p => p.name).join(', ')}`
    };
  }

  return { isValid: true };
}

/**
 * Round score calculation for Rummy variants:
 * finalRoundScore = baseScore * multiplier
 */
export function calculateRoundScore(baseScore: number, multiplier: number): number {
  return Math.round(baseScore * multiplier);
}

/**
 * Calculate the total score for a single player across multiple round scores
 */
export function calculateGameTotal(roundScores: number[]): number {
  return roundScores.reduce((acc, score) => acc + score, 0);
}

/**
 * Calculate totals for each player in a session across all completed or active rounds
 */
export function calculateSessionTotals(session: GameSession): Record<string, number> {
  const totals: Record<string, number> = {};
  
  for (const player of session.players) {
    totals[player.id] = 0;
  }

  for (const round of session.rounds) {
    for (const [playerId, score] of Object.entries(round.scores)) {
      if (score && score.entered) {
        totals[playerId] = (totals[playerId] || 0) + score.finalScore;
      }
    }
  }

  return totals;
}

export interface PlayerRankResult {
  playerId: string;
  totalScore: number;
  rank: number;
  isWinner: boolean;
  isRunnerUp: boolean;
  isLoser: boolean;
}

/**
 * Calculate ranking for players based on their total scores.
 * CRITICAL RULE: LOWEST TOTAL SCORE = WINNER (Rank 1).
 * Second lowest = RUNNER-UP (Rank 2).
 * Highest total = LOSER (Last rank).
 */
export function calculateRanking(
  playerTotals: { playerId: string; totalScore: number }[]
): PlayerRankResult[] {
  if (playerTotals.length === 0) return [];

  // Sort ascending by totalScore (lowest score is best)
  const sorted = [...playerTotals].sort((a, b) => a.totalScore - b.totalScore);
  const highestScore = sorted[sorted.length - 1].totalScore;

  let currentRank = 1;
  const results: PlayerRankResult[] = [];

  for (let i = 0; i < sorted.length; i++) {
    // Standard competition ranking for ties
    if (i > 0 && sorted[i].totalScore > sorted[i - 1].totalScore) {
      currentRank = i + 1;
    }

    const item = sorted[i];
    const isWinner = item.totalScore === sorted[0].totalScore;
    
    // Runner-up: rank === 2, or if winner was tied, next lowest
    const isRunnerUp = !isWinner && (currentRank === 2 || (sorted[0].totalScore === sorted[1]?.totalScore && currentRank <= 2));
    const isLoser = item.totalScore === highestScore;

    results.push({
      playerId: item.playerId,
      totalScore: item.totalScore,
      rank: currentRank,
      isWinner,
      isRunnerUp,
      isLoser
    });
  }

  return results;
}

/**
 * TEA RULE:
 * Exactly one or more players become tea-duty losers only when they have the highest final session score.
 * Normal case: Single player with highest score = that player buys tea.
 * Tie case: If 2 or more players share the highest score, ALL tied highest-score players are tea-duty losers!
 */
export function calculateTeaDutyPlayers(
  playerTotals: { playerId: string; totalScore: number }[]
): string[] {
  if (playerTotals.length === 0) return [];

  let maxScore = -Infinity;
  for (const p of playerTotals) {
    if (p.totalScore > maxScore) {
      maxScore = p.totalScore;
    }
  }

  // All players who scored the maxScore
  return playerTotals
    .filter(p => p.totalScore === maxScore)
    .map(p => p.playerId);
}

/**
 * Build complete SessionResult objects for each player in a session
 */
export function buildSessionResults(session: GameSession): SessionResult[] {
  const totals = calculateSessionTotals(session);
  const totalsList = Object.entries(totals).map(([playerId, totalScore]) => ({
    playerId,
    totalScore
  }));

  const rankings = calculateRanking(totalsList);
  const teaDutyPlayerIds = calculateTeaDutyPlayers(totalsList);
  const rankMap = new Map(rankings.map(r => [r.playerId, r]));

  // Calculate dick hands (0 base score) and busts (>= full value)
  const statsMap: Record<string, { dicks: number; busts: number }> = {};
  for (const player of session.players) {
    statsMap[player.id] = { dicks: 0, busts: 0 };
  }

  for (const round of session.rounds) {
    for (const [playerId, score] of Object.entries(round.scores)) {
      if (score && score.entered) {
        if (score.scoreType === 'dick' || score.baseScore === 0) {
          statsMap[playerId].dicks += 1;
        } else if (score.scoreType === 'full' || score.baseScore >= session.gameConfig.fullPenaltyValue) {
          statsMap[playerId].busts += 1;
        }
      }
    }
  }

  return session.players.map(player => {
    const rankInfo = rankMap.get(player.id) || {
      rank: session.players.length,
      isWinner: false,
      isRunnerUp: false,
      isLoser: false
    };
    const isTeaDuty = teaDutyPlayerIds.includes(player.id);
    const playerStats = statsMap[player.id] || { dicks: 0, busts: 0 };

    return {
      sessionId: session.id,
      playerId: player.id,
      playerName: player.name,
      totalScore: totals[player.id] || 0,
      finalPosition: rankInfo.rank,
      isWinner: rankInfo.isWinner,
      isRunnerUp: rankInfo.isRunnerUp,
      isTeaDuty,
      dickHandsCount: playerStats.dicks,
      bustsCount: playerStats.busts
    };
  }).sort((a, b) => a.totalScore - b.totalScore);
}

/**
 * Calculate player statistics after session finalization.
 * Enforces:
 * - Update stats ONLY when a session is finalized for the first time
 * - Tied losers each receive teaBought + 1
 * - Does not double-count if already finalized
 */
export function updatePlayerStatistics(
  currentStats: Record<string, PlayerStats>,
  session: GameSession,
  results: SessionResult[]
): Record<string, PlayerStats> {
  // If session was already finalized previously, do NOT double-count!
  if (session.isFinalized) {
    return currentStats;
  }

  const updated = { ...currentStats };

  for (const result of results) {
    const existing = updated[result.playerId] || {
      playerId: result.playerId,
      playerName: result.playerName,
      sessionsPlayed: 0,
      wins: 0,
      runnerUps: 0,
      teaBought: 0,
      averageScore: result.totalScore,
      bestScore: result.totalScore,
      worstScore: result.totalScore,
      winRatio: 0,
      recentResults: []
    };

    const newSessionsPlayed = existing.sessionsPlayed + 1;
    const newWins = existing.wins + (result.isWinner ? 1 : 0);
    const newRunnerUps = existing.runnerUps + (result.isRunnerUp ? 1 : 0);
    const newTeaBought = existing.teaBought + (result.isTeaDuty ? 1 : 0);
    
    const totalPreviousScore = existing.averageScore * existing.sessionsPlayed;
    const newAverage = Math.round((totalPreviousScore + result.totalScore) / newSessionsPlayed);
    
    const newBest = existing.sessionsPlayed === 0 
      ? result.totalScore 
      : Math.min(existing.bestScore, result.totalScore);
    const newWorst = existing.sessionsPlayed === 0 
      ? result.totalScore 
      : Math.max(existing.worstScore, result.totalScore);

    const winRatio = Math.round((newWins / newSessionsPlayed) * 100);

    const outcome: 'win' | 'podium' | 'safe' | 'tea' = result.isWinner
      ? 'win'
      : result.isTeaDuty
      ? 'tea'
      : result.isRunnerUp
      ? 'podium'
      : 'safe';

    const recentResults = [outcome, ...(existing.recentResults || [])].slice(0, 5);

    updated[result.playerId] = {
      playerId: result.playerId,
      playerName: result.playerName,
      sessionsPlayed: newSessionsPlayed,
      wins: newWins,
      runnerUps: newRunnerUps,
      teaBought: newTeaBought,
      averageScore: newAverage,
      bestScore: newBest,
      worstScore: newWorst,
      winRatio,
      recentResults
    };
  }

  return updated;
}
