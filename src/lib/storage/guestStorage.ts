import { GameSession, Player, PlayerStats } from '../../domain/models/types';

export const GUEST_STORAGE_KEYS = {
  SESSIONS: 'score_sip_guest_sessions',
  PLAYERS: 'score_sip_guest_players',
  STATS: 'score_sip_guest_stats',
  ACTIVE_SESSION_ID: 'score_sip_guest_active_session_id',
  EXPIRES_AT: 'score_sip_guest_expires_at'
};

// 72 hours time-to-live in milliseconds
export const GUEST_TTL_MS = 72 * 60 * 60 * 1000;

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
    return (globalThis as unknown as { localStorage: Storage }).localStorage;
  }
  return null;
}

export class GuestStorageService {
  /**
   * Check if guest storage has expired (past 72 hours).
   * If expired, purge all guest keys automatically.
   */
  static isGuestExpired(): boolean {
    const storage = getStorage();
    if (!storage) return false;

    const raw = storage.getItem(GUEST_STORAGE_KEYS.EXPIRES_AT);
    if (!raw) return false;

    const expiresAt = parseInt(raw, 10);
    if (isNaN(expiresAt)) return false;

    if (Date.now() > expiresAt) {
      this.clearGuestStorage();
      return true;
    }
    return false;
  }

  /**
   * Safely purge only guest-scoped storage keys.
   * Never deletes auth keys, theme preferences, or user data.
   */
  static clearGuestStorage(): void {
    const storage = getStorage();
    if (!storage) return;

    storage.removeItem(GUEST_STORAGE_KEYS.SESSIONS);
    storage.removeItem(GUEST_STORAGE_KEYS.PLAYERS);
    storage.removeItem(GUEST_STORAGE_KEYS.STATS);
    storage.removeItem(GUEST_STORAGE_KEYS.ACTIVE_SESSION_ID);
    storage.removeItem(GUEST_STORAGE_KEYS.EXPIRES_AT);
  }

  /**
   * Refresh or set the 72-hour guest expiration timestamp.
   */
  static touchGuestSession(): void {
    const storage = getStorage();
    if (!storage) return;

    const currentExpiry = storage.getItem(GUEST_STORAGE_KEYS.EXPIRES_AT);
    // If not set or already expired, set to 72 hours from now
    if (!currentExpiry || Date.now() > parseInt(currentExpiry, 10)) {
      storage.setItem(GUEST_STORAGE_KEYS.EXPIRES_AT, (Date.now() + GUEST_TTL_MS).toString());
    }
  }

  static getGuestSessions(): GameSession[] {
    const storage = getStorage();
    if (!storage) return [];

    if (this.isGuestExpired()) return [];

    try {
      const raw = storage.getItem(GUEST_STORAGE_KEYS.SESSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveGuestSessions(sessions: GameSession[]): void {
    const storage = getStorage();
    if (!storage) return;

    this.touchGuestSession();
    try {
      storage.setItem(GUEST_STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('[GuestStorage] saveGuestSessions quota warning:', e);
    }
  }

  static getGuestPlayers(): Player[] {
    const storage = getStorage();
    if (!storage) return [];

    if (this.isGuestExpired()) return [];

    try {
      const raw = storage.getItem(GUEST_STORAGE_KEYS.PLAYERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveGuestPlayers(players: Player[]): void {
    const storage = getStorage();
    if (!storage) return;

    this.touchGuestSession();
    try {
      storage.setItem(GUEST_STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    } catch (e) {
      console.warn('[GuestStorage] saveGuestPlayers quota warning:', e);
    }
  }

  static getGuestStats(): Record<string, PlayerStats> {
    const storage = getStorage();
    if (!storage) return {};

    if (this.isGuestExpired()) return {};

    try {
      const raw = storage.getItem(GUEST_STORAGE_KEYS.STATS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static saveGuestStats(stats: Record<string, PlayerStats>): void {
    const storage = getStorage();
    if (!storage) return;

    this.touchGuestSession();
    try {
      storage.setItem(GUEST_STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('[GuestStorage] saveGuestStats quota warning:', e);
    }
  }

  static getGuestActiveSessionId(): string | null {
    const storage = getStorage();
    if (!storage) return null;

    if (this.isGuestExpired()) return null;

    return storage.getItem(GUEST_STORAGE_KEYS.ACTIVE_SESSION_ID);
  }

  static saveGuestActiveSessionId(id: string | null): void {
    const storage = getStorage();
    if (!storage) return;

    this.touchGuestSession();
    if (id) {
      storage.setItem(GUEST_STORAGE_KEYS.ACTIVE_SESSION_ID, id);
    } else {
      storage.removeItem(GUEST_STORAGE_KEYS.ACTIVE_SESSION_ID);
    }
  }

  /**
   * Get remaining guest hours for user notification.
   */
  static getRemainingGuestHours(): number {
    const storage = getStorage();
    if (!storage) return 72;

    const raw = storage.getItem(GUEST_STORAGE_KEYS.EXPIRES_AT);
    if (!raw) return 72;

    const diff = parseInt(raw, 10) - Date.now();
    if (diff <= 0) return 0;
    return Math.max(1, Math.round(diff / (1000 * 60 * 60)));
  }
}
