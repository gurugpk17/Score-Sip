import { getSupabaseClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import {
  LocalStoragePhotoRepository,
  LocalStoragePlayerRepository,
  LocalStorageSessionRepository,
  LocalStorageStatsRepository
} from './localStorageRepo';
import {
  SupabasePhotoRepository,
  SupabasePlayerRepository,
  SupabaseSessionRepository,
  SupabaseStatsRepository
} from './supabaseRepo';
import {
  IPhotoRepository,
  IPersistenceRepository,
  IPlayerRepository,
  ISessionRepository,
  IStatsRepository
} from './types';
import {
  GamePhoto,
  GameSession,
  Player,
  PlayerStats,
  RoundScore,
  SessionResult
} from '../../domain/models/types';

export class PersistenceRepository implements IPersistenceRepository {
  public players: IPlayerRepository;
  public sessions: ISessionRepository;
  public stats: IStatsRepository;
  public photos: IPhotoRepository;

  private localPlayers = new LocalStoragePlayerRepository();
  private localSessions = new LocalStorageSessionRepository();
  private localStats = new LocalStorageStatsRepository();
  private localPhotos = new LocalStoragePhotoRepository(this.localSessions);

  private supabasePlayers: SupabasePlayerRepository | null = null;
  private supabaseSessions: SupabaseSessionRepository | null = null;
  private supabaseStats: SupabaseStatsRepository | null = null;
  private supabasePhotos: SupabasePhotoRepository | null = null;

  private cloudConnected = false;

  constructor() {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      this.supabasePlayers = new SupabasePlayerRepository(client);
      this.supabaseSessions = new SupabaseSessionRepository(client);
      this.supabaseStats = new SupabaseStatsRepository(client);
      this.supabasePhotos = new SupabasePhotoRepository(client);
      this.cloudConnected = true;
    }

    // Wrap repositories with fallback capability and optional userId scoping
    this.players = {
      getPlayers: async (userId?: string) => {
        if (this.cloudConnected && this.supabasePlayers) {
          try {
            const cloudPlayers = await this.supabasePlayers.getPlayers(userId);
            if (cloudPlayers.length > 0 || userId) {
              await this.localPlayers.savePlayers(cloudPlayers, userId);
              return cloudPlayers;
            }
          } catch (err) {
            console.warn('[Persistence] Cloud getPlayers failed, falling back to local', err);
          }
        }
        return this.localPlayers.getPlayers(userId);
      },

      savePlayers: async (players: Player[], userId?: string) => {
        await this.localPlayers.savePlayers(players, userId);
        if (this.cloudConnected && this.supabasePlayers) {
          try {
            await this.supabasePlayers.savePlayers(players, userId);
          } catch (err) {
            console.warn('[Persistence] Cloud savePlayers failed (queued locally)', err);
          }
        }
      },

      createPlayer: async (player: Player, userId?: string) => {
        const createdLocal = await this.localPlayers.createPlayer(player, userId);
        if (this.cloudConnected && this.supabasePlayers) {
          try {
            await this.supabasePlayers.createPlayer(createdLocal, userId);
          } catch (err) {
            console.warn('[Persistence] Cloud createPlayer failed (saved locally)', err);
          }
        }
        return createdLocal;
      },

      deletePlayer: async (playerId: string, userId?: string) => {
        await this.localPlayers.deletePlayer(playerId, userId);
        if (this.cloudConnected && this.supabasePlayers) {
          try {
            await this.supabasePlayers.deletePlayer(playerId, userId);
          } catch (err) {
            console.warn('[Persistence] Cloud deletePlayer failed', err);
          }
        }
      }
    };

    this.sessions = {
      getSessions: async (userId?: string) => {
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            const cloudSessions = await this.supabaseSessions.getSessions(userId);
            if (cloudSessions.length > 0 || userId) {
              await this.localSessions.saveSessions(cloudSessions, userId);
              return cloudSessions;
            }
          } catch (err) {
            console.warn('[Persistence] Cloud getSessions failed, falling back to local', err);
          }
        }
        return this.localSessions.getSessions(userId);
      },

      getSessionById: async (id: string, userId?: string) => {
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            const session = await this.supabaseSessions.getSessionById(id, userId);
            if (session) return session;
          } catch (err) {
            console.warn('[Persistence] Cloud getSessionById failed', err);
          }
        }
        return this.localSessions.getSessionById(id, userId);
      },

      saveSession: async (session: GameSession, userId?: string) => {
        const effectiveUser = userId || session.userId;
        await this.localSessions.saveSession(session, effectiveUser);
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            await this.supabaseSessions.saveSession(session, effectiveUser);
          } catch (err) {
            console.warn('[Persistence] Cloud saveSession failed (saved locally)', err);
          }
        }
      },

      saveSessions: async (sessions: GameSession[], userId?: string) => {
        await this.localSessions.saveSessions(sessions, userId);
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            await this.supabaseSessions.saveSessions(sessions, userId);
          } catch (err) {
            console.warn('[Persistence] Cloud saveSessions failed', err);
          }
        }
      },

      getActiveSessionId: async (userId?: string) => {
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            const id = await this.supabaseSessions.getActiveSessionId(userId);
            if (id !== undefined && id !== null) return id;
          } catch (err) {
            console.warn('[Persistence] Cloud getActiveSessionId failed', err);
          }
        }
        return this.localSessions.getActiveSessionId(userId);
      },

      setActiveSessionId: async (id: string | null, userId?: string) => {
        await this.localSessions.setActiveSessionId(id, userId);
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            await this.supabaseSessions.setActiveSessionId(id, userId);
          } catch (err) {
            console.warn('[Persistence] Cloud setActiveSessionId failed', err);
          }
        }
      },

      saveRoundScore: async (
        sessionId: string,
        roundNumber: number,
        playerId: string,
        score: RoundScore
      ) => {
        await this.localSessions.saveRoundScore(sessionId, roundNumber, playerId, score);
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            await this.supabaseSessions.saveRoundScore(sessionId, roundNumber, playerId, score);
          } catch (err) {
            console.warn('[Persistence] Cloud saveRoundScore failed', err);
          }
        }
      },

      finalizeSession: async (session: GameSession, results: SessionResult[]) => {
        await this.localSessions.finalizeSession(session, results);
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            await this.supabaseSessions.finalizeSession(session, results);
          } catch (err) {
            console.warn('[Persistence] Cloud finalizeSession failed', err);
          }
        }
      }
    };

    this.stats = {
      getPlayerStats: async (userId?: string) => {
        if (this.cloudConnected && this.supabaseStats) {
          try {
            const cloudStats = await this.supabaseStats.getPlayerStats(userId);
            if (Object.keys(cloudStats).length > 0 || userId) {
              await this.localStats.savePlayerStats(cloudStats, userId);
              return cloudStats;
            }
          } catch (err) {
            console.warn('[Persistence] Cloud getPlayerStats failed, falling back to local', err);
          }
        }
        return this.localStats.getPlayerStats(userId);
      },

      savePlayerStats: async (stats: Record<string, PlayerStats>, userId?: string) => {
        await this.localStats.savePlayerStats(stats, userId);
        if (this.cloudConnected && this.supabaseStats) {
          try {
            await this.supabaseStats.savePlayerStats(stats, userId);
          } catch (err) {
            console.warn('[Persistence] Cloud savePlayerStats failed', err);
          }
        }
      },

      updateStatsForSession: async (
        currentStats: Record<string, PlayerStats>,
        session: GameSession,
        results: SessionResult[],
        userId?: string
      ) => {
        const effectiveUser = userId || session.userId;
        const updatedLocal = await this.localStats.updateStatsForSession(currentStats, session, results, effectiveUser);
        if (this.cloudConnected && this.supabaseStats) {
          try {
            await this.supabaseStats.updateStatsForSession(currentStats, session, results, effectiveUser);
          } catch (err) {
            console.warn('[Persistence] Cloud updateStatsForSession failed', err);
          }
        }
        return updatedLocal;
      }
    };

    this.photos = {
      getPhotosForSession: async (sessionId: string, userId?: string) => {
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            return await this.supabasePhotos.getPhotosForSession(sessionId, userId);
          } catch (err) {
            console.warn('[Persistence] Cloud getPhotosForSession failed', err);
          }
        }
        return this.localPhotos.getPhotosForSession(sessionId, userId);
      },

      getAllPhotos: async (userId?: string) => {
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            return await this.supabasePhotos.getAllPhotos(userId);
          } catch (err) {
            console.warn('[Persistence] Cloud getAllPhotos failed', err);
          }
        }
        return this.localPhotos.getAllPhotos(userId);
      },

      savePhotoMetadata: async (photo: GamePhoto, userId?: string) => {
        const effectiveUser = userId || photo.userId;
        await this.localPhotos.savePhotoMetadata(photo, effectiveUser);
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            await this.supabasePhotos.savePhotoMetadata(photo, effectiveUser);
          } catch (err) {
            console.warn('[Persistence] Cloud savePhotoMetadata failed', err);
          }
        }
      },

      deletePhoto: async (sessionId: string, photoId: string, storagePath?: string, userId?: string) => {
        await this.localPhotos.deletePhoto(sessionId, photoId, storagePath, userId);
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            await this.supabasePhotos.deletePhoto(sessionId, photoId, storagePath, userId);
          } catch (err) {
            console.warn('[Persistence] Cloud deletePhoto failed', err);
          }
        }
      },

      uploadPhoto: async (
        sessionId: string,
        photoId: string,
        fileOrBase64: File | string,
        thumbnailDataUrl?: string,
        userId?: string
      ) => {
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            return await this.supabasePhotos.uploadPhoto(
              sessionId,
              photoId,
              fileOrBase64,
              thumbnailDataUrl,
              userId
            );
          } catch (err) {
            console.warn('[Persistence] Cloud uploadPhoto failed, using local fallback', err);
          }
        }
        return this.localPhotos.uploadPhoto(sessionId, photoId, fileOrBase64, thumbnailDataUrl, userId);
      },

      toggleLike: async (photoId: string) => {
        const localCount = await this.localPhotos.toggleLike(photoId);
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            return await this.supabasePhotos.toggleLike(photoId);
          } catch (err) {
            console.warn('[Persistence] Cloud toggleLike failed', err);
          }
        }
        return localCount;
      }
    };
  }

  isCloudConnected(): boolean {
    return this.cloudConnected;
  }

  getBackendType(): 'supabase' | 'localStorage' {
    return this.cloudConnected ? 'supabase' : 'localStorage';
  }
}

export const persistenceRepository = new PersistenceRepository();
