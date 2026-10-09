import { GameSession, Player, PlayerStats } from '../../domain/models/types';
import { PRESET_GAMES } from '../../domain/scoring/rules';
import { persistenceRepository } from '../repositories/persistenceRepository';

const STORAGE_KEYS = {
  SESSIONS: 'rummy7s_sessions_v1',
  ACTIVE_SESSION_ID: 'rummy7s_active_session_id_v1',
  PLAYERS: 'rummy7s_players_v1',
  STATS: 'rummy7s_player_stats_v1'
};

import {
  INITIAL_PLAYERS,
  INITIAL_STATS,
  INITIAL_COMPLETED_SESSION,
  SECOND_COMPLETED_SESSION
} from './seedData';

export {
  INITIAL_PLAYERS,
  INITIAL_STATS,
  INITIAL_COMPLETED_SESSION,
  SECOND_COMPLETED_SESSION
};

export async function compressImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<{ dataUrl: string; thumbnailUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            dataUrl: e.target?.result as string,
            thumbnailUrl: e.target?.result as string
          });
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Thumbnail canvas (max 360px)
        const thumbCanvas = document.createElement('canvas');
        const thumbSize = 360;
        let tWidth = img.width;
        let tHeight = img.height;
        if (tWidth > tHeight) {
          tHeight = Math.round((tHeight * thumbSize) / tWidth);
          tWidth = thumbSize;
        } else {
          tWidth = Math.round((tWidth * thumbSize) / tHeight);
          tHeight = thumbSize;
        }
        thumbCanvas.width = tWidth;
        thumbCanvas.height = tHeight;
        const thumbCtx = thumbCanvas.getContext('2d');
        thumbCtx?.drawImage(img, 0, 0, tWidth, tHeight);
        const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);

        resolve({ dataUrl, thumbnailUrl });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

import { getUserStorageKey } from '../repositories/localStorageRepo';

export class StorageService {
  static getSessions(userId?: string): GameSession[] {
    try {
      const key = getUserStorageKey('sessions', userId);
      const raw = localStorage.getItem(key);
      if (!raw) {
        if (userId) {
          return [];
        }
        this.saveSessions([INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION]);
        return [INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION];
      }
      const parsed: GameSession[] = JSON.parse(raw);
      if (!userId) {
        let changed = false;
        const merged = parsed.map(s => {
          if (s.id === INITIAL_COMPLETED_SESSION.id && (!s.photos || s.photos.length === 0)) {
            changed = true;
            return { ...s, photos: INITIAL_COMPLETED_SESSION.photos };
          }
          return s;
        });

        if (!merged.some(s => s.id === SECOND_COMPLETED_SESSION.id)) {
          merged.push(SECOND_COMPLETED_SESSION);
          changed = true;
        }

        if (changed) {
          this.saveSessions(merged);
        }
        return merged;
      }
      return parsed;
    } catch {
      return userId ? [] : [INITIAL_COMPLETED_SESSION, SECOND_COMPLETED_SESSION];
    }
  }

  static saveSessions(sessions: GameSession[], userId?: string): void {
    try {
      const key = getUserStorageKey('sessions', userId);
      localStorage.setItem(key, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Storage saveSessions failed', e);
    }
    persistenceRepository.sessions.saveSessions(sessions, userId).catch(e => {
      console.warn('[StorageService] persistence saveSessions failed', e);
    });
  }

  static getActiveSessionId(userId?: string): string | null {
    try {
      if (userId) {
        const sessions = this.getSessions(userId);
        const active = sessions.find(s => s.status === 'active');
        if (active) return active.id;
        return localStorage.getItem(getUserStorageKey('active_session_id', userId));
      }
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    } catch {
      return null;
    }
  }

  static setActiveSessionId(id: string | null, userId?: string): void {
    try {
      const key = getUserStorageKey('active_session_id', userId);
      if (id) {
        localStorage.setItem(key, id);
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Storage setActiveSessionId failed', e);
    }
    persistenceRepository.sessions.setActiveSessionId(id, userId).catch(e => {
      console.warn('[StorageService] persistence setActiveSessionId failed', e);
    });
  }

  static getPlayers(userId?: string): Player[] {
    try {
      const key = getUserStorageKey('players', userId);
      const raw = localStorage.getItem(key);
      if (!raw) {
        if (userId) {
          return [];
        }
        this.savePlayers(INITIAL_PLAYERS);
        return INITIAL_PLAYERS;
      }
      return JSON.parse(raw);
    } catch {
      return userId ? [] : INITIAL_PLAYERS;
    }
  }

  static savePlayers(players: Player[], userId?: string): void {
    try {
      const key = getUserStorageKey('players', userId);
      localStorage.setItem(key, JSON.stringify(players));
    } catch (e) {
      console.warn('Storage savePlayers failed', e);
    }
    persistenceRepository.players.savePlayers(players, userId).catch(e => {
      console.warn('[StorageService] persistence savePlayers failed', e);
    });
  }

  static getPlayerStats(userId?: string): Record<string, PlayerStats> {
    try {
      const key = getUserStorageKey('stats', userId);
      const raw = localStorage.getItem(key);
      if (!raw) {
        if (userId) {
          return {};
        }
        this.savePlayerStats(INITIAL_STATS);
        return INITIAL_STATS;
      }
      return JSON.parse(raw);
    } catch {
      return userId ? {} : INITIAL_STATS;
    }
  }

  static savePlayerStats(stats: Record<string, PlayerStats>, userId?: string): void {
    try {
      const key = getUserStorageKey('stats', userId);
      localStorage.setItem(key, JSON.stringify(stats));
    } catch (e) {
      console.warn('Storage savePlayerStats failed', e);
    }
    persistenceRepository.stats.savePlayerStats(stats, userId).catch(e => {
      console.warn('[StorageService] persistence savePlayerStats failed', e);
    });
  }

  static async syncFromPersistence(userId?: string): Promise<{
    sessions: GameSession[];
    players: Player[];
    stats: Record<string, PlayerStats>;
  }> {
    const [sessions, players, stats] = await Promise.all([
      persistenceRepository.sessions.getSessions(userId),
      persistenceRepository.players.getPlayers(userId),
      persistenceRepository.stats.getPlayerStats(userId)
    ]);
    return { sessions, players, stats };
  }
}
