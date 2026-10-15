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
import { GuestStorageService } from './guestStorage';

export class StorageService {
  static getSessions(userId?: string): GameSession[] {
    const isGuest = !userId || userId === 'guest';
    if (isGuest) {
      return GuestStorageService.getGuestSessions();
    }

    try {
      const key = getUserStorageKey('sessions', userId);
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveSessions(sessions: GameSession[], userId?: string): void {
    const isGuest = !userId || userId === 'guest';
    if (isGuest) {
      GuestStorageService.saveGuestSessions(sessions);
      return;
    }

    try {
      const key = getUserStorageKey('sessions', userId);
      localStorage.setItem(key, JSON.stringify(sessions));
    } catch (e) {
      console.warn('[StorageService] saveSessions quota warning:', e);
    }
    persistenceRepository.sessions.saveSessions(sessions, userId).catch(e => {
      console.warn('[StorageService] persistence saveSessions failed', e);
    });
  }

  static getActiveSessionId(userId?: string): string | null {
    const isGuest = !userId || userId === 'guest';
    if (isGuest) {
      return GuestStorageService.getGuestActiveSessionId();
    }

    try {
      const sessions = this.getSessions(userId);
      const active = sessions.find(s => s.status === 'active');
      if (active) return active.id;
      return localStorage.getItem(getUserStorageKey('active_session_id', userId));
    } catch {
      return null;
    }
  }

  static setActiveSessionId(id: string | null, userId?: string): void {
    const isGuest = !userId || userId === 'guest';
    if (isGuest) {
      GuestStorageService.saveGuestActiveSessionId(id);
      return;
    }

    try {
      const key = getUserStorageKey('active_session_id', userId);
      if (id) {
        localStorage.setItem(key, id);
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('[StorageService] setActiveSessionId failed', e);
    }
    persistenceRepository.sessions.setActiveSessionId(id, userId).catch(e => {
      console.warn('[StorageService] persistence setActiveSessionId failed', e);
    });
  }

  static getPlayers(userId?: string): Player[] {
    const isGuest = !userId || userId === 'guest';
    if (isGuest) {
      return GuestStorageService.getGuestPlayers();
    }

    try {
      const key = getUserStorageKey('players', userId);
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static savePlayers(players: Player[], userId?: string): void {
    const isGuest = !userId || userId === 'guest';
    if (isGuest) {
      GuestStorageService.saveGuestPlayers(players);
      return;
    }

    try {
      const key = getUserStorageKey('players', userId);
      localStorage.setItem(key, JSON.stringify(players));
    } catch (e) {
      console.warn('[StorageService] savePlayers failed', e);
    }
    persistenceRepository.players.savePlayers(players, userId).catch(e => {
      console.warn('[StorageService] persistence savePlayers failed', e);
    });
  }

  static getPlayerStats(userId?: string): Record<string, PlayerStats> {
    const isGuest = !userId || userId === 'guest';
    if (isGuest) {
      return GuestStorageService.getGuestStats();
    }

    try {
      const key = getUserStorageKey('stats', userId);
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  static savePlayerStats(stats: Record<string, PlayerStats>, userId?: string): void {
    const isGuest = !userId || userId === 'guest';
    if (isGuest) {
      GuestStorageService.saveGuestStats(stats);
      return;
    }

    try {
      const key = getUserStorageKey('stats', userId);
      localStorage.setItem(key, JSON.stringify(stats));
    } catch (e) {
      console.warn('[StorageService] savePlayerStats failed', e);
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
    const effectiveUser = userId || 'guest';
    const [sessions, players, stats] = await Promise.all([
      persistenceRepository.sessions.getSessions(effectiveUser),
      persistenceRepository.players.getPlayers(effectiveUser),
      persistenceRepository.stats.getPlayerStats(effectiveUser)
    ]);
    return { sessions, players, stats };
  }
}
