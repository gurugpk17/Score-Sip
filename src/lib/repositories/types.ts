import {
  GamePhoto,
  GameRound,
  GameSession,
  Player,
  PlayerStats,
  RoundScore,
  SessionResult
} from '../../domain/models/types';

export interface IPlayerRepository {
  getPlayers(userId?: string): Promise<Player[]>;
  savePlayers(players: Player[], userId?: string): Promise<void>;
  createPlayer(player: Player, userId?: string): Promise<Player>;
  deletePlayer(playerId: string, userId?: string): Promise<void>;
}

export interface ISessionRepository {
  getSessions(userId?: string): Promise<GameSession[]>;
  getSessionById(id: string, userId?: string): Promise<GameSession | null>;
  saveSession(session: GameSession, userId?: string): Promise<void>;
  saveSessions(sessions: GameSession[], userId?: string): Promise<void>;
  getActiveSessionId(userId?: string): Promise<string | null>;
  setActiveSessionId(id: string | null, userId?: string): Promise<void>;
  saveRoundScore(
    sessionId: string,
    roundNumber: number,
    playerId: string,
    score: RoundScore
  ): Promise<void>;
  finalizeSession(session: GameSession, results: SessionResult[]): Promise<void>;
}

export interface IStatsRepository {
  getPlayerStats(userId?: string): Promise<Record<string, PlayerStats>>;
  savePlayerStats(stats: Record<string, PlayerStats>, userId?: string): Promise<void>;
  updateStatsForSession(
    currentStats: Record<string, PlayerStats>,
    session: GameSession,
    results: SessionResult[],
    userId?: string
  ): Promise<Record<string, PlayerStats>>;
}

export interface IPhotoRepository {
  getPhotosForSession(sessionId: string, userId?: string): Promise<GamePhoto[]>;
  getAllPhotos(userId?: string): Promise<GamePhoto[]>;
  savePhotoMetadata(photo: GamePhoto, userId?: string): Promise<void>;
  deletePhoto(sessionId: string, photoId: string, storagePath?: string, userId?: string): Promise<void>;
  uploadPhoto(
    sessionId: string,
    photoId: string,
    fileOrBase64: File | string,
    thumbnailDataUrl?: string,
    userId?: string
  ): Promise<{ storagePath: string; thumbnailUrl: string }>;
  toggleLike(photoId: string): Promise<number>;
}

export interface IPersistenceRepository {
  players: IPlayerRepository;
  sessions: ISessionRepository;
  stats: IStatsRepository;
  photos: IPhotoRepository;
  isCloudConnected(): boolean;
  getBackendType(): 'supabase' | 'localStorage';
}
