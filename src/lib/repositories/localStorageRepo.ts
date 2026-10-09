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

export function getUserStorageKey(baseKey: string, userId?: string): string {
  if (userId) {
    return `score_sip_${baseKey}_${userId}`;
  }
  return `rummy7s_${baseKey}_v1`;
}

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
  async getPlayers(userId?: string): Promise<Player[]> {
    const storage = getStorage();
    if (!storage) return userId ? [] : INITIAL_PLAYERS;

    try {
      const key = getUserStorageKey('players', userId);
      const raw = storage.getItem(key);
      if (!raw) {
        if (userId) {
          // Fresh user account starts with 0 players
          return [];
        }
        await this.savePlayers(INITIAL_PLAYERS);
        return INITIAL_PLAYERS;
      }
      return JSON.parse(raw);
    } catch {
      return userId ? [] : INITIAL_PLAYERS;
    }
  }

  async savePlayers(players: Player[], userId?: string): Promise<void> {
    const storage = getStorage();
    if (!storage) return;

    try {
      const key = getUserStorageKey('players', userId);
      storage.setItem(key, JSON.stringify(players));
    } catch (e) {
      console.warn('[LocalStorage] savePlayers failed', e);
    }
  }

  async createPlayer(player: Player, userId?: string): Promise<Player> {
    const list = await this.getPlayers(userId);
    const playerWithUser: Player = {
      ...player,
      userId: userId || player.userId
    };
    const updated = [...list, playerWithUser];
    await this.savePlayers(updated, userId);
    return playerWithUser;
  }

  async deletePlayer(playerId: string, userId?: string): Promise<void> {
    const list = await this.getPlayers(userId);
    const filtered = list.filter(p => p.id !== playerId);
    await this.savePlayers(filtered, userId);
  }
}

export class LocalStorageSessionRepository implements ISessionRepository {
  async getSessions(userId?: string): Promise<GameSession[]> {
    const storage = getStorage();
    if (!storage) return userId ? [] : [INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION];

    try {
      const key = getUserStorageKey('sessions', userId);
      const raw = storage.getItem(key);
      if (!raw) {
        if (userId) {
          return [];
        }
        await this.saveSessions([INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION]);
        return [INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION];
      }
      return JSON.parse(raw);
    } catch {
      return userId ? [] : [INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION];
    }
  }

  async getSessionById(id: string, userId?: string): Promise<GameSession | null> {
    const sessions = await this.getSessions(userId);
    return sessions.find(s => s.id === id) || null;
  }

  async saveSession(session: GameSession, userId?: string): Promise<void> {
    const effectiveUserId = userId || session.userId;
    const sessions = await this.getSessions(effectiveUserId);
    const sessionWithUser = {
      ...session,
      userId: effectiveUserId || undefined
    };
    const exists = sessions.some(s => s.id === session.id);
    const updated = exists
      ? sessions.map(s => (s.id === session.id ? sessionWithUser : s))
      : [sessionWithUser, ...sessions];
    await this.saveSessions(updated, effectiveUserId);
  }

  async saveSessions(sessions: GameSession[], userId?: string): Promise<void> {
    const storage = getStorage();
    if (!storage) return;

    try {
      const key = getUserStorageKey('sessions', userId);
      storage.setItem(key, JSON.stringify(sessions));
    } catch (e) {
      console.warn('[LocalStorage] saveSessions failed', e);
    }
  }

  async getActiveSessionId(userId?: string): Promise<string | null> {
    const storage = getStorage();
    if (!storage) return null;

    try {
      if (userId) {
        // Query sessions directly for active status scoped to this user
        const sessions = await this.getSessions(userId);
        const active = sessions.find(s => s.status === 'active');
        if (active) return active.id;
        return storage.getItem(getUserStorageKey('active_session_id', userId));
      }
      return storage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    } catch {
      return null;
    }
  }

  async setActiveSessionId(id: string | null, userId?: string): Promise<void> {
    const storage = getStorage();
    if (!storage) return;

    try {
      const key = getUserStorageKey('active_session_id', userId);
      if (id) {
        storage.setItem(key, id);
      } else {
        storage.removeItem(key);
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
      await this.saveSession(session, session.userId);
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
    await this.saveSession(updated, session.userId);
    await this.setActiveSessionId(null, session.userId);
  }
}

export class LocalStorageStatsRepository implements IStatsRepository {
  async getPlayerStats(userId?: string): Promise<Record<string, PlayerStats>> {
    const storage = getStorage();
    if (!storage) return userId ? {} : INITIAL_STATS;

    try {
      const key = getUserStorageKey('stats', userId);
      const raw = storage.getItem(key);
      if (!raw) {
        if (userId) return {};
        await this.savePlayerStats(INITIAL_STATS);
        return INITIAL_STATS;
      }
      return JSON.parse(raw);
    } catch {
      return userId ? {} : INITIAL_STATS;
    }
  }

  async savePlayerStats(stats: Record<string, PlayerStats>, userId?: string): Promise<void> {
    const storage = getStorage();
    if (!storage) return;

    try {
      const key = getUserStorageKey('stats', userId);
      storage.setItem(key, JSON.stringify(stats));
    } catch (e) {
      console.warn('[LocalStorage] savePlayerStats failed', e);
    }
  }

  async updateStatsForSession(
    currentStats: Record<string, PlayerStats>,
    session: GameSession,
    results: SessionResult[],
    userId?: string
  ): Promise<Record<string, PlayerStats>> {
    const effectiveUserId = userId || session.userId;
    const updated = updatePlayerStatistics(currentStats, session, results);
    await this.savePlayerStats(updated, effectiveUserId);
    return updated;
  }
}

export class LocalStoragePhotoRepository implements IPhotoRepository {
  constructor(private sessionRepo: ISessionRepository) {}

  async getPhotosForSession(sessionId: string, userId?: string): Promise<GamePhoto[]> {
    const session = await this.sessionRepo.getSessionById(sessionId, userId);
    return session?.photos || [];
  }

  async getAllPhotos(userId?: string): Promise<GamePhoto[]> {
    const sessions = await this.sessionRepo.getSessions(userId);
    return sessions.flatMap(s => s.photos || []);
  }

  async savePhotoMetadata(photo: GamePhoto, userId?: string): Promise<void> {
    const effectiveUserId = userId || photo.userId;
    const session = await this.sessionRepo.getSessionById(photo.sessionId, effectiveUserId);
    if (!session) return;
    const existing = session.photos || [];
    const photoWithUser = { ...photo, userId: effectiveUserId };
    const updatedPhotos = [photoWithUser, ...existing.filter(p => p.id !== photo.id)];
    await this.sessionRepo.saveSession(
      {
        ...session,
        photos: updatedPhotos
      },
      effectiveUserId
    );
  }

  async deletePhoto(sessionId: string, photoId: string, storagePath?: string, userId?: string): Promise<void> {
    const session = await this.sessionRepo.getSessionById(sessionId, userId);
    if (!session) return;
    const updatedPhotos = (session.photos || []).filter(p => p.id !== photoId);
    await this.sessionRepo.saveSession(
      {
        ...session,
        photos: updatedPhotos
      },
      userId || session.userId
    );
  }

  async uploadPhoto(
    sessionId: string,
    photoId: string,
    fileOrBase64: File | string,
    thumbnailDataUrl?: string,
    userId?: string
  ): Promise<{ storagePath: string; thumbnailUrl: string }> {
    let dataUrl = typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
    if (typeof fileOrBase64 !== 'string') {
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
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
    for (const session of sessions) {
      const photo = (session.photos || []).find(p => p.id === photoId);
      if (photo) {
        photo.likes = (photo.likes || 0) + 1;
        await this.sessionRepo.saveSession(session, session.userId);
        return photo.likes;
      }
    }
    return 1;
  }
}
