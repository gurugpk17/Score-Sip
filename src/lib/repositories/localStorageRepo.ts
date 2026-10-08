import {
  GamePhoto,
  GameSession,
  Player,
  PlayerStats,
  RoundScore,
  SessionResult
} from '../../domain/models/types';
import {
  IPhotoRepository,
  IPlayerRepository,
  ISessionRepository,
  IStatsRepository
} from './types';
import {
  INITIAL_COMPLETED_SESSION,
  INITIAL_PLAYERS,
  INITIAL_STATS,
  SECOND_COMPLETED_SESSION
} from '../storage/seedData';
import { updatePlayerStatistics } from '../../domain/scoring/engine';

const STORAGE_KEYS = {
  SESSIONS: 'rummy7s_sessions_v1',
  ACTIVE_SESSION_ID: 'rummy7s_active_session_id_v1',
  PLAYERS: 'rummy7s_players_v1',
  STATS: 'rummy7s_player_stats_v1'
};

interface SimpleStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function getStorage(): SimpleStorage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: SimpleStorage }).localStorage) {
    return (globalThis as unknown as { localStorage: SimpleStorage }).localStorage;
  }
  return null;
}

export class LocalStoragePlayerRepository implements IPlayerRepository {
  async getPlayers(): Promise<Player[]> {
    const storage = getStorage();
    if (!storage) return INITIAL_PLAYERS;

    try {
      const raw = storage.getItem(STORAGE_KEYS.PLAYERS);
      if (!raw) {
        await this.savePlayers(INITIAL_PLAYERS);
        return INITIAL_PLAYERS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_PLAYERS;
    }
  }

  async savePlayers(players: Player[]): Promise<void> {
    const storage = getStorage();
    if (!storage) return;

    try {
      storage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    } catch (e) {
      console.warn('[LocalStorage] savePlayers failed', e);
    }
  }

  async createPlayer(player: Player): Promise<Player> {
    const list = await this.getPlayers();
    const updated = [...list, player];
    await this.savePlayers(updated);
    return player;
  }

  async deletePlayer(playerId: string): Promise<void> {
    const list = await this.getPlayers();
    const filtered = list.filter(p => p.id !== playerId);
    await this.savePlayers(filtered);
  }
}

export class LocalStorageSessionRepository implements ISessionRepository {
  async getSessions(): Promise<GameSession[]> {
    const storage = getStorage();
    if (!storage) return [INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION];

    try {
      const raw = storage.getItem(STORAGE_KEYS.SESSIONS);
      if (!raw) {
        await this.saveSessions([INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION]);
        return [INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION];
      }
      const parsed: GameSession[] = JSON.parse(raw);
      return parsed;
    } catch {
      return [INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION];
    }
  }

  async getSessionById(id: string): Promise<GameSession | null> {
    const sessions = await this.getSessions();
    return sessions.find(s => s.id === id) || null;
  }

  async saveSession(session: GameSession): Promise<void> {
    const sessions = await this.getSessions();
    const exists = sessions.some(s => s.id === session.id);
    const updated = exists
      ? sessions.map(s => (s.id === session.id ? session : s))
      : [session, ...sessions];
    await this.saveSessions(updated);
  }

  async saveSessions(sessions: GameSession[]): Promise<void> {
    const storage = getStorage();
    if (!storage) return;

    try {
      storage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('[LocalStorage] saveSessions failed', e);
    }
  }

  async getActiveSessionId(): Promise<string | null> {
    const storage = getStorage();
    if (!storage) return null;

    try {
      return storage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    } catch {
      return null;
    }
  }

  async setActiveSessionId(id: string | null): Promise<void> {
    const storage = getStorage();
    if (!storage) return;

    try {
      if (id) {
        storage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
      } else {
        storage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
      }
    } catch (e) {
      console.warn('[LocalStorage] setActiveSessionId failed', e);
    }
  }

  async saveRoundScore(
    sessionId: string,
    roundNumber: number,
    playerId: string,
    score: RoundScore
  ): Promise<void> {
    const sessions = await this.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const roundIdx = roundNumber - 1;
    if (session.rounds[roundIdx]) {
      session.rounds[roundIdx].scores[playerId] = score;
      session.rounds[roundIdx].isCompleted = session.players.every(
        p => session.rounds[roundIdx].scores[p.id]?.entered
      );
      await this.saveSession(session);
    }
  }

  async finalizeSession(session: GameSession, results: SessionResult[]): Promise<void> {
    const updated: GameSession = {
      ...session,
      status: 'completed',
      completedAt: new Date().toISOString(),
      isFinalized: true,
      results
    };
    await this.saveSession(updated);
    await this.setActiveSessionId(null);
  }
}

export class LocalStorageStatsRepository implements IStatsRepository {
  async getPlayerStats(): Promise<Record<string, PlayerStats>> {
    const storage = getStorage();
    if (!storage) return INITIAL_STATS;

    try {
      const raw = storage.getItem(STORAGE_KEYS.STATS);
      if (!raw) {
        await this.savePlayerStats(INITIAL_STATS);
        return INITIAL_STATS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_STATS;
    }
  }

  async savePlayerStats(stats: Record<string, PlayerStats>): Promise<void> {
    const storage = getStorage();
    if (!storage) return;

    try {
      storage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('[LocalStorage] savePlayerStats failed', e);
    }
  }

  async updateStatsForSession(
    currentStats: Record<string, PlayerStats>,
    session: GameSession,
    results: SessionResult[]
  ): Promise<Record<string, PlayerStats>> {
    const updated = updatePlayerStatistics(currentStats, session, results);
    await this.savePlayerStats(updated);
    return updated;
  }
}

export class LocalStoragePhotoRepository implements IPhotoRepository {
  constructor(private sessionRepo: ISessionRepository) {}

  async getPhotosForSession(sessionId: string): Promise<GamePhoto[]> {
    const session = await this.sessionRepo.getSessionById(sessionId);
    return session?.photos || [];
  }

  async getAllPhotos(): Promise<GamePhoto[]> {
    const sessions = await this.sessionRepo.getSessions();
    return sessions.flatMap(s => s.photos || []);
  }

  async savePhotoMetadata(photo: GamePhoto): Promise<void> {
    const session = await this.sessionRepo.getSessionById(photo.sessionId);
    if (!session) return;
    const existing = session.photos || [];
    const updatedPhotos = [photo, ...existing.filter(p => p.id !== photo.id)];
    await this.sessionRepo.saveSession({
      ...session,
      photos: updatedPhotos
    });
  }

  async deletePhoto(sessionId: string, photoId: string): Promise<void> {
    const session = await this.sessionRepo.getSessionById(sessionId);
    if (!session) return;
    const existing = session.photos || [];
    const updatedPhotos = existing.filter(p => p.id !== photoId);
    await this.sessionRepo.saveSession({
      ...session,
      photos: updatedPhotos
    });
  }

  async uploadPhoto(
    sessionId: string,
    photoId: string,
    fileOrBase64: File | string,
    thumbnailDataUrl?: string
  ): Promise<{ storagePath: string; thumbnailUrl: string }> {
    let dataUrl: string;
    if (typeof fileOrBase64 === 'string') {
      dataUrl = fileOrBase64;
    } else {
      dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBase64);
      });
    }

    return {
      storagePath: dataUrl,
      thumbnailUrl: thumbnailDataUrl || dataUrl
    };
  }

  async toggleLike(photoId: string): Promise<number> {
    const sessions = await this.sessionRepo.getSessions();
    let newLikes = 0;
    for (const s of sessions) {
      if (s.photos) {
        const p = s.photos.find(photo => photo.id === photoId);
        if (p) {
          p.likes = (p.likes || 0) + 1;
          newLikes = p.likes;
          await this.sessionRepo.saveSession(s);
          break;
        }
      }
    }
    return newLikes;
  }
}
