export type GameVariantType = '7s' | '5s' | 'ace' | 'custom';

export interface GameConfig {
  id: string;
  name: string;
  variant: GameVariantType;
  roundCount: number;
  multipliers: number[];
  fullPenaltyValue: number; // default 80
  description: string;
  tagline: string;
}

export interface Player {
  id: string;
  name: string;
  seatNumber: number;
  isHost?: boolean;
  avatarUrl?: string;
  initials: string;
  avatarColor?: string;
}

export interface RoundScore {
  playerId: string;
  baseScore: number; // e.g. 0 for DICK, 80 for FULL, or custom
  multiplier: number;
  finalScore: number;
  scoreType: 'dick' | 'full' | 'custom';
  entered: boolean;
}

export interface GameRound {
  roundNumber: number;
  multiplier: number;
  scores: Record<string, RoundScore>; // playerId -> RoundScore
  isCompleted: boolean;
}

export interface SessionResult {
  sessionId: string;
  playerId: string;
  playerName: string;
  totalScore: number;
  finalPosition: number;
  isWinner: boolean;
  isRunnerUp: boolean;
  isTeaDuty: boolean;
  dickHandsCount: number;
  bustsCount: number;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  sessionsPlayed: number;
  wins: number;
  runnerUps: number;
  teaBought: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  winRatio: number; // e.g. 53%
  recentResults: ('win' | 'podium' | 'safe' | 'tea')[];
}

export interface GamePhoto {
  id: string;
  sessionId: string;
  gameName: string;
  sessionName: string;
  storagePath: string; // URL or local/supabase storage key
  thumbnailUrl?: string;
  caption: string;
  tag?: string; // e.g. "ROUND 5 CARD FLIP", "Tea Duty", "Guru Crowned", "Festive Night Series"
  subCaption?: string; // e.g. "Intense declaration round at 01:14 AM"
  badge?: string; // e.g. "Samosas", "MVP", "+1 More"
  uploadedAt: string;
  uploadedBy?: string;
  playerInitials?: string[];
  likes?: number;
}

export interface GameSession {
  id: string;
  name: string;
  gameConfig: GameConfig;
  status: 'draft' | 'active' | 'completed';
  players: Player[];
  currentRoundNumber: number;
  rounds: GameRound[];
  startedAt: string;
  completedAt?: string;
  isFinalized: boolean;
  results?: SessionResult[];
  teaSettled?: boolean;
  tableNote?: string;
  photos?: GamePhoto[];
}
