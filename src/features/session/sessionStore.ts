import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { GameConfig, GamePhoto, GameRound, GameSession, GameVariantType, Player, PlayerStats, SessionResult } from '../../domain/models/types';
import { PRESET_GAMES, STANDARD_FULL_VALUE } from '../../domain/scoring/rules';
import {
  buildSessionResults,
  calculateRoundScore,
  calculateSessionTotals,
  updatePlayerStatistics
} from '../../domain/scoring/engine';
import { StorageService } from '../../lib/storage/db';
import { persistenceRepository } from '../../lib/repositories/persistenceRepository';
import { triggerHaptic, getHapticsEnabled, setHapticsEnabled } from '../../lib/utils/haptics';
import { getSupabaseClient } from '../../lib/supabase/client';

export type ScreenView = 'dashboard' | 'setup' | 'live' | 'results' | 'ledger' | 'rankings' | 'gallery' | 'game-details' | 'players';

interface SessionState {
  currentScreen: ScreenView;
  selectedVariant: GameVariantType;
  customGameConfig: Partial<GameConfig>;
  activeSession: GameSession | null;
  historySessions: GameSession[];
  playersRoster: Player[];
  playerStats: Record<string, PlayerStats>;

  // Score Entry Pad state
  activeScoringPlayerId: string | null;
  baseScoreInput: number;
  activeScoreType: 'custom' | 'dick' | 'full';

  // Photo & Gallery state
  selectedGameDetailsId: string | null;
  activePhotoModal: GamePhoto | null;
  deleteConfirmPhoto: { photo: GamePhoto; sessionId: string } | null;
  addPhotoModalSessionId: string | null;

  // UI & Menu & Theme state
  user: User | null;
  authLoading: boolean;
  theme: 'light' | 'dark';
  hapticsEnabled: boolean;
  toastMessage: string | null;
  viewingHistoricalSessionId: string | null;
  isMenuOpen: boolean;
  isProfileOpen: boolean;
  isSettingsOpen: boolean;
  isRulesOpen: boolean;
  isCustomGameOpen: boolean;

  // Actions
  setScreen: (screen: ScreenView) => void;
  selectVariant: (variant: GameVariantType) => void;
  setCustomGameConfig: (config: Partial<GameConfig>) => void;
  
  // Theme & Menu Modals
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setMenuOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setRulesOpen: (open: boolean) => void;
  setCustomGameOpen: (open: boolean) => void;

  // Authentication
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncUserData: (userId?: string) => Promise<void>;

  // Table Setup
  addPlayerToRoster: (name: string) => boolean;
  removePlayerFromRoster: (playerId: string) => void;
  
  // Session Lifecycle
  startNewSession: () => void;
  resumeActiveSession: () => void;
  selectScoringPlayer: (playerId: string) => void;
  setBaseScore: (score: number) => void;
  appendDigitToScore: (digit: string) => void;
  backspaceScore: () => void;
  clearScore: () => void;
  setDickScore: () => void;
  setFullScore: () => void;
  confirmPlayerScore: () => void;
  completeRound: () => void;
  finalizeSession: () => void;
  startRematch: () => void;
  settleTeaDuty: (sessionId?: string) => void;
  viewSessionDetails: (sessionId: string) => void;
  viewGameDetails: (sessionId: string) => void;

  // Photo Actions
  addPhotoToSession: (sessionId: string, photoData: Omit<GamePhoto, 'id' | 'uploadedAt'>) => void;
  deletePhotoFromSession: (sessionId: string, photoId: string) => void;
  togglePhotoLike: (photoId: string) => void;
  openPhotoViewer: (photo: GamePhoto) => void;
  closePhotoViewer: () => void;
  openDeletePhotoModal: (photo: GamePhoto, sessionId: string) => void;
  closeDeletePhotoModal: () => void;
  openAddPhotoModal: (sessionId?: string) => void;
  closeAddPhotoModal: () => void;
  
  // Settings & Utilities
  isCloudConnected: boolean;
  initializePersistence: () => Promise<void>;
  toggleHaptics: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => {
  const initialTheme = typeof window !== 'undefined'
    ? (localStorage.getItem('score_sip_theme') as 'light' | 'dark') || 'dark'
    : 'dark';

  const initialSessions = StorageService.getSessions();
  const initialPlayers = StorageService.getPlayers();
  const initialStats = StorageService.getPlayerStats();
  const savedActiveId = StorageService.getActiveSessionId();
  const activeSession = savedActiveId 
    ? initialSessions.find(s => s.id === savedActiveId && s.status === 'active') || null
    : null;

  return {
    currentScreen: 'dashboard',
    selectedVariant: '7s',
    customGameConfig: {
      name: 'Custom Rummy',
      roundCount: 6,
      multipliers: [2, 1, 1, 1, 1, 2],
      fullPenaltyValue: STANDARD_FULL_VALUE
    },
    activeSession,
    historySessions: initialSessions,
    playersRoster: initialPlayers,
    playerStats: initialStats,

    activeScoringPlayerId: null,
    baseScoreInput: 0,
    activeScoreType: 'custom',

    selectedGameDetailsId: null,
    activePhotoModal: null,
    deleteConfirmPhoto: null,
    addPhotoModalSessionId: null,

    user: null,
    authLoading: true,
    theme: initialTheme,
    hapticsEnabled: getHapticsEnabled(),
    toastMessage: null,
    viewingHistoricalSessionId: null,
    isMenuOpen: false,
    isProfileOpen: false,
    isSettingsOpen: false,
    isRulesOpen: false,
    isCustomGameOpen: false,
    isCloudConnected: persistenceRepository.isCloudConnected(),

    setScreen: (screen) => {
      triggerHaptic('selection');
      set({ currentScreen: screen });
    },

    selectVariant: (variant) => {
      triggerHaptic('selection');
      set({ selectedVariant: variant });
    },

    setCustomGameConfig: (config) => {
      set(state => ({
        customGameConfig: { ...state.customGameConfig, ...config }
      }));
    },

    setMenuOpen: (open) => set({ isMenuOpen: open }),
    setProfileOpen: (open) => set({ isProfileOpen: open }),
    setSettingsOpen: (open) => set({ isSettingsOpen: open }),
    setRulesOpen: (open) => set({ isRulesOpen: open }),
    setCustomGameOpen: (open) => set({ isCustomGameOpen: open }),

    toggleTheme: () => {
      const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },

    setTheme: (theme) => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        localStorage.setItem('score_sip_theme', theme);
      }
      triggerHaptic('selection');
      set({ theme });
    },

    signInWithGoogle: async () => {
      const client = getSupabaseClient();
      if (!client) {
        get().showToast("Cloud connection unavailable (offline mode).");
        return;
      }
      try {
        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) {
          console.error('[Auth] Google sign in error:', error);
          get().showToast(`Sign in error: ${error.message}`);
        }
      } catch (err) {
        console.error('[Auth] Sign in exception:', err);
        get().showToast("Unable to start Google sign-in.");
      }
    },

    signOut: async () => {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.auth.signOut();
        } catch (err) {
          console.warn('[Auth] Sign out error:', err);
        }
      }
      set({ user: null });
      // Reload guest data safely
      await get().syncUserData(undefined);
      get().showToast("Signed out successfully.");
    },

    syncUserData: async (userId?: string) => {
      const { user } = get();
      const targetUserId = userId !== undefined ? userId : user?.id;

      try {
        const { sessions, players, stats } = await StorageService.syncFromPersistence(targetUserId);
        const activeId = await persistenceRepository.sessions.getActiveSessionId(targetUserId);
        const activeSess = activeId 
          ? sessions.find(s => s.id === activeId && s.status === 'active') || null
          : sessions.find(s => s.status === 'active') || null;

        set({
          historySessions: sessions,
          playersRoster: players,
          playerStats: stats,
          activeSession: activeSess,
          isCloudConnected: persistenceRepository.isCloudConnected()
        });
      } catch (err) {
        console.warn('[sessionStore] syncUserData warning:', err);
      }
    },

    addPlayerToRoster: (name) => {
      const cleanName = name.trim();
      if (!cleanName) return false;
      const { playersRoster, activeSession, user } = get();

      // If active session is running, table lock is enforced!
      if (activeSession && activeSession.status === 'active') {
        get().showToast("Table is locked! No new joins permitted during active match.");
        return false;
      }

      if (playersRoster.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
        get().showToast(`${cleanName} is already at the table!`);
        return false;
      }

      const colors = ['#10b981', '#ffb95f', '#ff7a73', '#6ffbbe', '#ffb4ab', '#ee9800'];
      const newPlayer: Player = {
        id: `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId: user ? user.id : undefined,
        name: cleanName,
        seatNumber: playersRoster.length + 1,
        initials: cleanName.charAt(0).toUpperCase(),
        avatarColor: colors[playersRoster.length % colors.length]
      };

      const updated = [...playersRoster, newPlayer];
      StorageService.savePlayers(updated, user?.id);
      triggerHaptic('medium');
      set({ playersRoster: updated });
      return true;
    },

    removePlayerFromRoster: (playerId) => {
      const { activeSession, playersRoster, user } = get();
      if (activeSession && activeSession.status === 'active') {
        get().showToast("Table lock enforced! Cannot remove players during active match.");
        return;
      }

      const filtered = playersRoster.filter(p => p.id !== playerId);
      // Renumber seats
      const renumbered = filtered.map((p, idx) => ({ ...p, seatNumber: idx + 1 }));
      StorageService.savePlayers(renumbered, user?.id);
      triggerHaptic('light');
      set({ playersRoster: renumbered });
    },

    startNewSession: () => {
      const { selectedVariant, customGameConfig, playersRoster, user } = get();
      if (playersRoster.length < 2) {
        get().showToast("Need at least 2 players to start a session!");
        return;
      }

      triggerHaptic('success');
      const gameConfig: GameConfig = selectedVariant === 'custom'
        ? PRESET_GAMES.custom(customGameConfig)
        : PRESET_GAMES[selectedVariant]();

      // Initialize rounds
      const rounds: GameRound[] = Array.from({ length: gameConfig.roundCount }, (_, i) => ({
        roundNumber: i + 1,
        multiplier: gameConfig.multipliers[i] || 1,
        scores: {},
        isCompleted: false
      }));

      const newSession: GameSession = {
        id: `session_${Date.now()}`,
        userId: user ? user.id : undefined,
        name: `${gameConfig.name} Match #${Math.floor(100 + Math.random() * 900)}`,
        gameConfig,
        status: 'active',
        players: [...playersRoster],
        currentRoundNumber: 1,
        rounds,
        startedAt: new Date().toISOString(),
        isFinalized: false,
        tableNote: `Table #${Math.floor(Math.random() * 20) + 1}`
      };

      const firstPlayerId = playersRoster[0]?.id || null;

      StorageService.setActiveSessionId(newSession.id, user?.id);
      const allSessions = [newSession, ...get().historySessions.filter(s => s.id !== newSession.id)];
      StorageService.saveSessions(allSessions, user?.id);

      set({
        activeSession: newSession,
        historySessions: allSessions,
        activeScoringPlayerId: firstPlayerId,
        baseScoreInput: 0,
        activeScoreType: 'custom',
        currentScreen: 'live'
      });

      get().showToast(`Session Started: ${gameConfig.name}`);
    },

    resumeActiveSession: () => {
      const { activeSession } = get();
      if (!activeSession) return;
      
      const currentRound = activeSession.rounds[activeSession.currentRoundNumber - 1];
      const pendingPlayer = activeSession.players.find(p => !currentRound?.scores[p.id]?.entered);
      const targetPlayerId = pendingPlayer ? pendingPlayer.id : activeSession.players[0].id;

      set({
        activeScoringPlayerId: targetPlayerId,
        baseScoreInput: 0,
        activeScoreType: 'custom',
        currentScreen: 'live'
      });
      triggerHaptic('medium');
    },

    selectScoringPlayer: (playerId) => {
      const { activeSession } = get();
      if (!activeSession) return;
      const currentRound = activeSession.rounds[activeSession.currentRoundNumber - 1];
      const existingScore = currentRound?.scores[playerId];

      triggerHaptic('selection');
      set({
        activeScoringPlayerId: playerId,
        baseScoreInput: existingScore ? existingScore.baseScore : 0,
        activeScoreType: existingScore ? existingScore.scoreType : 'custom'
      });
    },

    setBaseScore: (score) => {
      const safeScore = Math.max(0, Math.floor(score));
      const fullPenaltyValue = get().activeSession?.gameConfig.fullPenaltyValue || STANDARD_FULL_VALUE;
      const scoreType = safeScore === 0 ? 'dick' : safeScore === fullPenaltyValue ? 'full' : 'custom';
      triggerHaptic('light');
      set({
        baseScoreInput: safeScore,
        activeScoreType: scoreType
      });
    },

    appendDigitToScore: (digit) => {
      if (!/^[0-9]$/.test(digit)) return;
      const { baseScoreInput, activeScoreType, activeSession } = get();
      const fullPenaltyValue = activeSession?.gameConfig.fullPenaltyValue || STANDARD_FULL_VALUE;

      let newStr: string;
      if (activeScoreType === 'full' || baseScoreInput === 0) {
        newStr = digit;
      } else {
        newStr = baseScoreInput.toString() + digit;
      }

      const val = parseInt(newStr, 10);
      const finalVal = isNaN(val) ? 0 : Math.min(Math.max(0, val), 99999);
      const scoreType = finalVal === 0 ? 'dick' : finalVal === fullPenaltyValue ? 'full' : 'custom';

      triggerHaptic('light');
      set({
        baseScoreInput: finalVal,
        activeScoreType: scoreType
      });
    },

    backspaceScore: () => {
      const { baseScoreInput, activeSession } = get();
      const str = baseScoreInput.toString();
      const fullPenaltyValue = activeSession?.gameConfig.fullPenaltyValue || STANDARD_FULL_VALUE;

      if (str.length <= 1) {
        triggerHaptic('light');
        set({
          baseScoreInput: 0,
          activeScoreType: 'dick'
        });
        return;
      }

      const truncated = parseInt(str.slice(0, -1), 10);
      const finalVal = isNaN(truncated) ? 0 : truncated;
      const scoreType = finalVal === 0 ? 'dick' : finalVal === fullPenaltyValue ? 'full' : 'custom';

      triggerHaptic('light');
      set({
        baseScoreInput: finalVal,
        activeScoreType: scoreType
      });
    },

    clearScore: () => {
      triggerHaptic('medium');
      set({
        baseScoreInput: 0,
        activeScoreType: 'custom'
      });
    },

    setDickScore: () => {
      triggerHaptic('medium');
      set({
        baseScoreInput: 0,
        activeScoreType: 'dick'
      });
    },

    setFullScore: () => {
      const fullPenalty = get().activeSession?.gameConfig.fullPenaltyValue || STANDARD_FULL_VALUE;
      triggerHaptic('heavy');
      set({
        baseScoreInput: fullPenalty,
        activeScoreType: 'full'
      });
    },

    confirmPlayerScore: () => {
      const {
        activeSession,
        activeScoringPlayerId,
        baseScoreInput,
        activeScoreType,
        historySessions,
        user
      } = get();

      if (!activeSession || !activeScoringPlayerId) return;

      const roundIndex = activeSession.currentRoundNumber - 1;
      const currentRound = activeSession.rounds[roundIndex];
      if (!currentRound) return;

      const roundMultiplier = currentRound.multiplier || 1;
      const calculatedRoundScore = calculateRoundScore(
        baseScoreInput,
        roundMultiplier,
        activeScoreType,
        activeSession.gameConfig.variant
      );

      const scoreEntry: RoundScore = {
        playerId: activeScoringPlayerId,
        baseScore: baseScoreInput,
        multiplier: roundMultiplier,
        finalScore: calculatedRoundScore,
        scoreType: activeScoreType,
        entered: true
      };

      const updatedScores = {
        ...currentRound.scores,
        [activeScoringPlayerId]: scoreEntry
      };

      const allEntered = activeSession.players.every(
        p => p.id === activeScoringPlayerId || updatedScores[p.id]?.entered
      );

      const updatedRound: GameRound = {
        ...currentRound,
        scores: updatedScores,
        isCompleted: allEntered
      };

      const updatedRounds = [...activeSession.rounds];
      updatedRounds[roundIndex] = updatedRound;

      const updatedSession: GameSession = {
        ...activeSession,
        rounds: updatedRounds
      };

      // Find next player needing score entry
      const nextPlayer = activeSession.players.find(
        p => p.id !== activeScoringPlayerId && !updatedScores[p.id]?.entered
      );

      const updatedHistory = historySessions.map(s =>
        s.id === updatedSession.id ? updatedSession : s
      );

      StorageService.saveSessions(updatedHistory, user?.id);

      triggerHaptic('success');
      set({
        activeSession: updatedSession,
        historySessions: updatedHistory,
        activeScoringPlayerId: nextPlayer ? nextPlayer.id : activeScoringPlayerId,
        baseScoreInput: nextPlayer && updatedScores[nextPlayer.id]
          ? updatedScores[nextPlayer.id]!.baseScore
          : 0,
        activeScoreType: nextPlayer && updatedScores[nextPlayer.id]
          ? updatedScores[nextPlayer.id]!.scoreType
          : 'custom'
      });

      // Async write single score to persistence
      persistenceRepository.sessions
        .saveRoundScore(activeSession.id, activeSession.currentRoundNumber, activeScoringPlayerId, scoreEntry)
        .catch(err => console.warn('[sessionStore] saveRoundScore cloud warning:', err));
    },

    completeRound: () => {
      const { activeSession, historySessions, user } = get();
      if (!activeSession) return;

      const currentRoundNum = activeSession.currentRoundNumber;
      const currentRound = activeSession.rounds[currentRoundNum - 1];

      // Verify all players entered score
      const unentered = activeSession.players.filter(p => !currentRound?.scores[p.id]?.entered);
      if (unentered.length > 0) {
        get().showToast(`Waiting for scores: ${unentered.map(p => p.name).join(', ')}`);
        return;
      }

      triggerHaptic('success');

      if (currentRoundNum < activeSession.gameConfig.roundCount) {
        const nextRoundNum = currentRoundNum + 1;
        const updatedSession: GameSession = {
          ...activeSession,
          currentRoundNumber: nextRoundNum
        };

        const updatedHistory = historySessions.map(s =>
          s.id === updatedSession.id ? updatedSession : s
        );

        StorageService.saveSessions(updatedHistory, user?.id);

        set({
          activeSession: updatedSession,
          historySessions: updatedHistory,
          activeScoringPlayerId: activeSession.players[0].id,
          baseScoreInput: 0,
          activeScoreType: 'custom'
        });

        get().showToast(`Round ${currentRoundNum} Complete! Starting Round ${nextRoundNum}`);
      } else {
        // All rounds finished! Finalize session
        get().finalizeSession();
      }
    },

    finalizeSession: () => {
      const { activeSession, historySessions, playerStats, user } = get();
      if (!activeSession) return;

      const results: SessionResult[] = buildSessionResults(activeSession);
      const updatedStats = updatePlayerStatistics(playerStats, activeSession, results);

      const finalizedSession: GameSession = {
        ...activeSession,
        status: 'completed',
        completedAt: new Date().toISOString(),
        isFinalized: true,
        results
      };

      StorageService.savePlayerStats(updatedStats, user?.id);
      StorageService.setActiveSessionId(null, user?.id);

      const updatedHistory = [finalizedSession, ...historySessions.filter(s => s.id !== finalizedSession.id)];
      StorageService.saveSessions(updatedHistory, user?.id);

      triggerHaptic('success');
      set({
        activeSession: finalizedSession,
        historySessions: updatedHistory,
        playerStats: updatedStats,
        currentScreen: 'results',
        viewingHistoricalSessionId: finalizedSession.id
      });

      get().showToast("Match Completed! Champion Crowned 👑");
    },

    startRematch: () => {
      const { activeSession } = get();
      const variant = activeSession?.gameConfig.variant || '7s';
      get().selectVariant(variant);
      get().startNewSession();
    },

    settleTeaDuty: (sessionId?: string) => {
      const { activeSession, historySessions, viewingHistoricalSessionId, selectedGameDetailsId, user } = get();
      const targetId = sessionId || selectedGameDetailsId || viewingHistoricalSessionId || activeSession?.id;
      if (!targetId) return;

      const updatedHistory = historySessions.map(s => {
        if (s.id === targetId) {
          return { ...s, teaSettled: !s.teaSettled };
        }
        return s;
      });

      StorageService.saveSessions(updatedHistory, user?.id);

      const updatedActive = activeSession?.id === targetId
        ? { ...activeSession, teaSettled: !activeSession.teaSettled }
        : activeSession;

      const targetSession = updatedHistory.find(s => s.id === targetId);
      const isSettled = targetSession?.teaSettled ?? false;

      triggerHaptic('success');
      set({
        activeSession: updatedActive,
        historySessions: updatedHistory
      });

      get().showToast(isSettled ? "Tea Duty Settled! ☕ Paid" : "Tea Duty Unsettled");
    },

    viewSessionDetails: (sessionId) => {
      const session = get().historySessions.find(s => s.id === sessionId);
      if (!session) return;

      triggerHaptic('selection');
      if (session.status === 'completed') {
        set({
          viewingHistoricalSessionId: sessionId,
          selectedGameDetailsId: sessionId,
          currentScreen: 'game-details'
        });
      } else {
        set({
          activeSession: session,
          currentScreen: 'live'
        });
      }
    },

    viewGameDetails: (sessionId) => {
      triggerHaptic('selection');
      set({
        selectedGameDetailsId: sessionId,
        viewingHistoricalSessionId: sessionId,
        currentScreen: 'game-details'
      });
    },

    addPhotoToSession: (sessionId, photoData) => {
      const { historySessions, activeSession, user } = get();
      const photoId = `snap_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const newPhoto: GamePhoto = {
        ...photoData,
        id: photoId,
        userId: user ? user.id : undefined,
        sessionId,
        uploadedAt: new Date().toISOString(),
        likes: 0
      };

      const updateSessionPhotos = (session: GameSession): GameSession => {
        if (session.id !== sessionId) return session;
        const photos = [newPhoto, ...(session.photos || [])];
        return { ...session, photos };
      };

      const updatedHistory = historySessions.map(updateSessionPhotos);
      StorageService.saveSessions(updatedHistory, user?.id);

      const updatedActive = activeSession?.id === sessionId ? updateSessionPhotos(activeSession) : activeSession;

      triggerHaptic('success');
      set({
        historySessions: updatedHistory,
        activeSession: updatedActive,
        addPhotoModalSessionId: null
      });
      get().showToast("Game snap added to ledger! 📸");

      // Asynchronously upload to Supabase storage if cloud is active
      if (persistenceRepository.isCloudConnected()) {
        persistenceRepository.photos
          .uploadPhoto(sessionId, photoId, newPhoto.storagePath, newPhoto.thumbnailUrl, user?.id)
          .then(async (uploaded) => {
            newPhoto.storagePath = uploaded.storagePath;
            newPhoto.thumbnailUrl = uploaded.thumbnailUrl;
            await persistenceRepository.photos.savePhotoMetadata(newPhoto, user?.id);

            // Update session state with cloud storage URLs
            const patchHistory = get().historySessions.map(s => {
              if (s.id !== sessionId) return s;
              return {
                ...s,
                photos: (s.photos || []).map(p => (p.id === photoId ? newPhoto : p))
              };
            });
            StorageService.saveSessions(patchHistory, user?.id);
            const patchActive = get().activeSession?.id === sessionId
              ? {
                  ...get().activeSession!,
                  photos: (get().activeSession!.photos || []).map(p => (p.id === photoId ? newPhoto : p))
                }
              : get().activeSession;
            set({ historySessions: patchHistory, activeSession: patchActive });
          })
          .catch(err => {
            console.warn('[sessionStore] Cloud photo upload failed, keeping local copy', err);
          });
      }
    },

    deletePhotoFromSession: (sessionId, photoId) => {
      const { historySessions, activeSession, user } = get();
      const targetSession = historySessions.find(s => s.id === sessionId) || activeSession;
      const targetPhoto = targetSession?.photos?.find(p => p.id === photoId);

      const removePhoto = (session: GameSession): GameSession => {
        if (session.id !== sessionId) return session;
        return {
          ...session,
          photos: (session.photos || []).filter(p => p.id !== photoId)
        };
      };

      const updatedHistory = historySessions.map(removePhoto);
      StorageService.saveSessions(updatedHistory, user?.id);

      const updatedActive = activeSession?.id === sessionId ? removePhoto(activeSession) : activeSession;

      persistenceRepository.photos.deletePhoto(sessionId, photoId, targetPhoto?.storagePath, user?.id).catch(err => {
        console.warn('[sessionStore] Cloud photo deletion failed', err);
      });

      triggerHaptic('medium');
      set({
        historySessions: updatedHistory,
        activeSession: updatedActive,
        activePhotoModal: null,
        deleteConfirmPhoto: null
      });
      get().showToast("Game snap removed.");
    },

    togglePhotoLike: (photoId) => {
      const { historySessions, activeSession, user } = get();
      const updateLike = (session: GameSession): GameSession => ({
        ...session,
        photos: (session.photos || []).map(p =>
          p.id === photoId ? { ...p, likes: (p.likes || 0) + 1 } : p
        )
      });

      const updatedHistory = historySessions.map(updateLike);
      StorageService.saveSessions(updatedHistory, user?.id);
      const updatedActive = activeSession ? updateLike(activeSession) : null;
      triggerHaptic('light');

      persistenceRepository.photos.toggleLike(photoId).catch(err => {
        console.warn('[sessionStore] Cloud like update failed', err);
      });

      set(state => ({
        historySessions: updatedHistory,
        activeSession: updatedActive,
        activePhotoModal: state.activePhotoModal?.id === photoId
          ? { ...state.activePhotoModal, likes: (state.activePhotoModal.likes || 0) + 1 }
          : state.activePhotoModal
      }));
    },

    openPhotoViewer: (photo) => {
      triggerHaptic('selection');
      set({ activePhotoModal: photo });
    },

    closePhotoViewer: () => {
      set({ activePhotoModal: null });
    },

    openDeletePhotoModal: (photo, sessionId) => {
      triggerHaptic('medium');
      set({ deleteConfirmPhoto: { photo, sessionId } });
    },

    closeDeletePhotoModal: () => {
      set({ deleteConfirmPhoto: null });
    },

    openAddPhotoModal: (sessionId) => {
      triggerHaptic('selection');
      const targetId = sessionId || get().activeSession?.id || get().historySessions[0]?.id || null;
      set({ addPhotoModalSessionId: targetId });
    },

    closeAddPhotoModal: () => {
      set({ addPhotoModalSessionId: null });
    },

    toggleHaptics: () => {
      const next = !get().hapticsEnabled;
      setHapticsEnabled(next);
      if (next) triggerHaptic('medium');
      set({ hapticsEnabled: next });
      get().showToast(next ? "Haptics Enabled" : "Haptics Muted");
    },

    showToast: (msg) => {
      set({ toastMessage: msg });
      setTimeout(() => {
        if (get().toastMessage === msg) {
          set({ toastMessage: null });
        }
      }, 2400);
    },

    initializePersistence: async () => {
      const client = getSupabaseClient();

      if (client) {
        try {
          // Listen to Supabase Auth state changes
          client.auth.onAuthStateChange(async (_event, session) => {
            const authUser = session?.user ?? null;
            set({ user: authUser, authLoading: false });
            await get().syncUserData(authUser?.id);
          });

          // Check current active session in Supabase Auth
          const { data: authSessionData } = await client.auth.getSession();
          const authUser = authSessionData.session?.user ?? null;
          set({ user: authUser, authLoading: false });
          await get().syncUserData(authUser?.id);
        } catch (err) {
          console.warn('[sessionStore] Auth initialization warning:', err);
          set({ authLoading: false });
          await get().syncUserData(undefined);
        }
      } else {
        set({ authLoading: false });
        await get().syncUserData(undefined);
      }
    },

    clearToast: () => set({ toastMessage: null })
  };
});
