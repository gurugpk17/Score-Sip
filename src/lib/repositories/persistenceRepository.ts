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

    // Wrap repositories with fallback capability
    this.players = {
      getPlayers: async () => {
        if (this.cloudConnected && this.supabasePlayers) {
          try {
            const cloudPlayers = await this.supabasePlayers.getPlayers();
            if (cloudPlayers.length > 0) {
              await this.localPlayers.savePlayers(cloudPlayers);
              return cloudPlayers;
            }
          } catch (err) {
            console.warn('[Persistence] Cloud getPlayers failed, falling back to local', err);
          }
        }
        return this.localPlayers.getPlayers();
      },

      savePlayers: async (players: Player[]) => {
        await this.localPlayers.savePlayers(players);
        if (this.cloudConnected && this.supabasePlayers) {
          try {
            await this.supabasePlayers.savePlayers(players);
          } catch (err) {
            console.warn('[Persistence] Cloud savePlayers failed (queued locally)', err);
          }
        }
      },

      createPlayer: async (player: Player) => {
        await this.localPlayers.createPlayer(player);
        if (this.cloudConnected && this.supabasePlayers) {
          try {
            await this.supabasePlayers.createPlayer(player);
          } catch (err) {
            console.warn('[Persistence] Cloud createPlayer failed (saved locally)', err);
          }
        }
        return player;
      },

      deletePlayer: async (playerId: string) => {
        await this.localPlayers.deletePlayer(playerId);
        if (this.cloudConnected && this.supabasePlayers) {
          try {
            await this.supabasePlayers.deletePlayer(playerId);
          } catch (err) {
            console.warn('[Persistence] Cloud deletePlayer failed', err);
          }
        }
      }
    };

    this.sessions = {
      getSessions: async () => {
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            const cloudSessions = await this.supabaseSessions.getSessions();
            if (cloudSessions.length > 0) {
              await this.localSessions.saveSessions(cloudSessions);
              return cloudSessions;
            }
          } catch (err) {
            console.warn('[Persistence] Cloud getSessions failed, falling back to local', err);
          }
        }
        return this.localSessions.getSessions();
      },

      getSessionById: async (id: string) => {
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            const session = await this.supabaseSessions.getSessionById(id);
            if (session) return session;
          } catch (err) {
            console.warn('[Persistence] Cloud getSessionById failed', err);
          }
        }
        return this.localSessions.getSessionById(id);
      },

      saveSession: async (session: GameSession) => {
        await this.localSessions.saveSession(session);
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            await this.supabaseSessions.saveSession(session);
          } catch (err) {
            console.warn('[Persistence] Cloud saveSession failed (saved locally)', err);
          }
        }
      },

      saveSessions: async (sessions: GameSession[]) => {
        await this.localSessions.saveSessions(sessions);
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            await this.supabaseSessions.saveSessions(sessions);
          } catch (err) {
            console.warn('[Persistence] Cloud saveSessions failed', err);
          }
        }
      },

      getActiveSessionId: async () => {
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            const id = await this.supabaseSessions.getActiveSessionId();
            if (id !== undefined) return id;
          } catch (err) {
            console.warn('[Persistence] Cloud getActiveSessionId failed', err);
          }
        }
        return this.localSessions.getActiveSessionId();
      },

      setActiveSessionId: async (id: string | null) => {
        await this.localSessions.setActiveSessionId(id);
        if (this.cloudConnected && this.supabaseSessions) {
          try {
            await this.supabaseSessions.setActiveSessionId(id);
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
      getPlayerStats: async () => {
        if (this.cloudConnected && this.supabaseStats) {
          try {
            const cloudStats = await this.supabaseStats.getPlayerStats();
            if (Object.keys(cloudStats).length > 0) {
              await this.localStats.savePlayerStats(cloudStats);
              return cloudStats;
            }
          } catch (err) {
            console.warn('[Persistence] Cloud getPlayerStats failed, falling back to local', err);
          }
        }
        return this.localStats.getPlayerStats();
      },

      savePlayerStats: async (stats: Record<string, PlayerStats>) => {
        await this.localStats.savePlayerStats(stats);
        if (this.cloudConnected && this.supabaseStats) {
          try {
            await this.supabaseStats.savePlayerStats(stats);
          } catch (err) {
            console.warn('[Persistence] Cloud savePlayerStats failed', err);
          }
        }
      },

      updateStatsForSession: async (
        currentStats: Record<string, PlayerStats>,
        session: GameSession,
        results: SessionResult[]
      ) => {
        const updatedLocal = await this.localStats.updateStatsForSession(currentStats, session, results);
        if (this.cloudConnected && this.supabaseStats) {
          try {
            await this.supabaseStats.updateStatsForSession(currentStats, session, results);
          } catch (err) {
            console.warn('[Persistence] Cloud updateStatsForSession failed', err);
          }
        }
        return updatedLocal;
      }
    };

    this.photos = {
      getPhotosForSession: async (sessionId: string) => {
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            return await this.supabasePhotos.getPhotosForSession(sessionId);
          } catch (err) {
            console.warn('[Persistence] Cloud getPhotosForSession failed', err);
          }
        }
        return this.localPhotos.getPhotosForSession(sessionId);
      },

      getAllPhotos: async () => {
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            return await this.supabasePhotos.getAllPhotos();
          } catch (err) {
            console.warn('[Persistence] Cloud getAllPhotos failed', err);
          }
        }
        return this.localPhotos.getAllPhotos();
      },

      savePhotoMetadata: async (photo: GamePhoto) => {
        await this.localPhotos.savePhotoMetadata(photo);
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            await this.supabasePhotos.savePhotoMetadata(photo);
          } catch (err) {
            console.warn('[Persistence] Cloud savePhotoMetadata failed', err);
          }
        }
      },

      deletePhoto: async (sessionId: string, photoId: string, storagePath?: string) => {
        await this.localPhotos.deletePhoto(sessionId, photoId);
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            await this.supabasePhotos.deletePhoto(sessionId, photoId, storagePath);
          } catch (err) {
            console.warn('[Persistence] Cloud deletePhoto failed', err);
          }
        }
      },

      uploadPhoto: async (
        sessionId: string,
        photoId: string,
        fileOrBase64: File | string,
        thumbnailDataUrl?: string
      ) => {
        if (this.cloudConnected && this.supabasePhotos) {
          try {
            return await this.supabasePhotos.uploadPhoto(
              sessionId,
              photoId,
              fileOrBase64,
              thumbnailDataUrl
            );
          } catch (err) {
            console.warn('[Persistence] Cloud uploadPhoto failed, using local fallback', err);
          }
        }
        return this.localPhotos.uploadPhoto(sessionId, photoId, fileOrBase64, thumbnailDataUrl);
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
