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
  getPlayers(): Promise<Player[]>;
  savePlayers(players: Player[]): Promise<void>;
  createPlayer(player: Player): Promise<Player>;
  deletePlayer(playerId: string): Promise<void>;
}

export interface ISessionRepository {
  getSessions(): Promise<GameSession[]>;
  getSessionById(id: string): Promise<GameSession | null>;
  saveSession(session: GameSession): Promise<void>;
  saveSessions(sessions: GameSession[]): Promise<void>;
  getActiveSessionId(): Promise<string | null>;
  setActiveSessionId(id: string | null): Promise<void>;
  saveRoundScore(
    sessionId: string,
    roundNumber: number,
    playerId: string,
    score: RoundScore
  ): Promise<void>;
  finalizeSession(session: GameSession, results: SessionResult[]): Promise<void>;
}

export interface IStatsRepository {
  getPlayerStats(): Promise<Record<string, PlayerStats>>;
  savePlayerStats(stats: Record<string, PlayerStats>): Promise<void>;
  updateStatsForSession(
    currentStats: Record<string, PlayerStats>,
    session: GameSession,
    results: SessionResult[]
  ): Promise<Record<string, PlayerStats>>;
}

export interface IPhotoRepository {
  getPhotosForSession(sessionId: string): Promise<GamePhoto[]>;
  getAllPhotos(): Promise<GamePhoto[]>;
  savePhotoMetadata(photo: GamePhoto): Promise<void>;
  deletePhoto(sessionId: string, photoId: string, storagePath?: string): Promise<void>;
  uploadPhoto(
    sessionId: string,
    photoId: string,
    fileOrBase64: File | string,
    thumbnailDataUrl?: string
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
