import { create } from 'zustand';
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
import { triggerHaptic } from '../../lib/utils/haptics';

export type ScreenView = 'dashboard' | 'setup' | 'live' | 'results' | 'ledger' | 'rankings' | 'gallery' | 'game-details';

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

  // UI state
  hapticsEnabled: boolean;
  toastMessage: string | null;
  viewingHistoricalSessionId: string | null;

  // Actions
  setScreen: (screen: ScreenView) => void;
  selectVariant: (variant: GameVariantType) => void;
  setCustomGameConfig: (config: Partial<GameConfig>) => void;
  
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

    hapticsEnabled: true,
    toastMessage: null,
    viewingHistoricalSessionId: null,
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

    addPlayerToRoster: (name) => {
      const cleanName = name.trim();
      if (!cleanName) return false;
      const { playersRoster, activeSession } = get();

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
        name: cleanName,
        seatNumber: playersRoster.length + 1,
        initials: cleanName.charAt(0).toUpperCase(),
        avatarColor: colors[playersRoster.length % colors.length]
      };

      const updated = [...playersRoster, newPlayer];
      StorageService.savePlayers(updated);
      triggerHaptic('medium');
      set({ playersRoster: updated });
      return true;
    },

    removePlayerFromRoster: (playerId) => {
      const { activeSession, playersRoster } = get();
      if (activeSession && activeSession.status === 'active') {
        get().showToast("Table lock enforced! Cannot remove players during active match.");
        return;
      }

      const filtered = playersRoster.filter(p => p.id !== playerId);
      // Renumber seats
      const renumbered = filtered.map((p, idx) => ({ ...p, seatNumber: idx + 1 }));
      StorageService.savePlayers(renumbered);
      triggerHaptic('light');
      set({ playersRoster: renumbered });
    },

    startNewSession: () => {
      const { selectedVariant, customGameConfig, playersRoster } = get();
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
        name: `${gameConfig.name} Match #${Math.floor(100 + Math.random() * 900)}`,
        gameConfig,
        status: 'active',
        players: [...playersRoster],
        currentRoundNumber: 1,
        rounds,
        startedAt: new Date().toISOString(),
        isFinalized: false,
        tableNote: `Table #${Math.floor(Math.random() * 20) + 1} • Local Session Encrypted`
      };

      // Set active scoring player to first player in seat 1
      const firstPlayerId = playersRoster[0]?.id || null;

      StorageService.setActiveSessionId(newSession.id);
      const allSessions = [newSession, ...get().historySessions.filter(s => s.id !== newSession.id)];
      StorageService.saveSessions(allSessions);

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
      // Pick first player who hasn't entered score yet, or first player
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
      // If score was FULL, tapping a digit starts a new number (e.g. entering 89 after FULL -> 8 -> 89; 234 after FULL -> 2 -> 23 -> 234)
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
      const fullPenaltyValue = activeSession?.gameConfig.fullPenaltyValue || STANDARD_FULL_VALUE;
      const str = baseScoreInput.toString();
      const newVal = str.length > 1 ? parseInt(str.slice(0, -1), 10) : 0;
      const scoreType = newVal === 0 ? 'dick' : newVal === fullPenaltyValue ? 'full' : 'custom';

      triggerHaptic('light');
      set({
        baseScoreInput: newVal,
        activeScoreType: scoreType
      });
    },

    clearScore: () => {
      triggerHaptic('medium');
      set({ baseScoreInput: 0, activeScoreType: 'dick' });
    },

    setDickScore: () => {
      triggerHaptic('medium');
      set({ baseScoreInput: 0, activeScoreType: 'dick' });
    },

    setFullScore: () => {
      const fullPenaltyValue = get().activeSession?.gameConfig.fullPenaltyValue || STANDARD_FULL_VALUE;
      triggerHaptic('heavy');
      set({ baseScoreInput: fullPenaltyValue, activeScoreType: 'full' });
    },

    confirmPlayerScore: () => {
      const { activeSession, activeScoringPlayerId, baseScoreInput, activeScoreType } = get();
      if (!activeSession || !activeScoringPlayerId) return;

      const roundIdx = activeSession.currentRoundNumber - 1;
      const currentRound = activeSession.rounds[roundIdx];
      if (!currentRound) return;

      const multiplier = currentRound.multiplier;
      const finalScore = calculateRoundScore(baseScoreInput, multiplier);

      const updatedScores = {
        ...currentRound.scores,
        [activeScoringPlayerId]: {
          playerId: activeScoringPlayerId,
          baseScore: baseScoreInput,
          multiplier,
          finalScore,
          scoreType: activeScoreType,
          entered: true
        }
      };

      const allPlayersEntered = activeSession.players.every(p => updatedScores[p.id]?.entered);

      const updatedRound: GameRound = {
        ...currentRound,
        scores: updatedScores,
        isCompleted: allPlayersEntered
      };

      const updatedRounds = [...activeSession.rounds];
      updatedRounds[roundIdx] = updatedRound;

      // Select next player in roster who still has pending score
      const nextPendingPlayer = activeSession.players.find(p => !updatedScores[p.id]?.entered && p.id !== activeScoringPlayerId);

      const updatedSession: GameSession = {
        ...activeSession,
        rounds: updatedRounds
      };

      triggerHaptic('success');

      // Save to persistence
      const history = get().historySessions.map(s => s.id === updatedSession.id ? updatedSession : s);
      StorageService.saveSessions(history);

      if (allPlayersEntered) {
        // Round is complete!
        set({
          activeSession: updatedSession,
          historySessions: history,
          activeScoringPlayerId: null,
          baseScoreInput: 0
        });
        get().completeRound();
      } else {
        set({
          activeSession: updatedSession,
          historySessions: history,
          activeScoringPlayerId: nextPendingPlayer ? nextPendingPlayer.id : null,
          baseScoreInput: 0,
          activeScoreType: 'custom'
        });
      }
    },

    completeRound: () => {
      const { activeSession } = get();
      if (!activeSession) return;

      const currentRoundNum = activeSession.currentRoundNumber;
      const totalRounds = activeSession.gameConfig.roundCount;

      if (currentRoundNum < totalRounds) {
        const nextRoundNum = currentRoundNum + 1;
        const updatedSession: GameSession = {
          ...activeSession,
          currentRoundNumber: nextRoundNum
        };

        const history = get().historySessions.map(s => s.id === updatedSession.id ? updatedSession : s);
        StorageService.saveSessions(history);

        // Pick seat 1 as initial scoring player for the next round
        const firstPlayerId = updatedSession.players[0]?.id || null;

        set({
          activeSession: updatedSession,
          historySessions: history,
          activeScoringPlayerId: firstPlayerId,
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
      const { activeSession, historySessions, playerStats } = get();
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

      StorageService.savePlayerStats(updatedStats);
      StorageService.setActiveSessionId(null);

      const updatedHistory = [finalizedSession, ...historySessions.filter(s => s.id !== finalizedSession.id)];
      StorageService.saveSessions(updatedHistory);

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
      const { activeSession, playersRoster } = get();
      const variant = activeSession?.gameConfig.variant || '7s';
      get().selectVariant(variant);
      get().startNewSession();
    },

    settleTeaDuty: (sessionId?: string) => {
      const { activeSession, historySessions, viewingHistoricalSessionId, selectedGameDetailsId } = get();
      const targetId = sessionId || selectedGameDetailsId || viewingHistoricalSessionId || activeSession?.id;
      if (!targetId) return;

      const updatedHistory = historySessions.map(s => {
        if (s.id === targetId) {
          return { ...s, teaSettled: !s.teaSettled };
        }
        return s;
      });

      StorageService.saveSessions(updatedHistory);

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
      const { historySessions, activeSession } = get();
      const photoId = `snap_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const newPhoto: GamePhoto = {
        ...photoData,
        id: photoId,
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
      StorageService.saveSessions(updatedHistory);

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
          .uploadPhoto(sessionId, photoId, newPhoto.storagePath, newPhoto.thumbnailUrl)
          .then(async (uploaded) => {
            newPhoto.storagePath = uploaded.storagePath;
            newPhoto.thumbnailUrl = uploaded.thumbnailUrl;
            await persistenceRepository.photos.savePhotoMetadata(newPhoto);

            // Update session state with cloud storage URLs
            const patchHistory = get().historySessions.map(s => {
              if (s.id !== sessionId) return s;
              return {
                ...s,
                photos: (s.photos || []).map(p => (p.id === photoId ? newPhoto : p))
              };
            });
            StorageService.saveSessions(patchHistory);
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
      const { historySessions, activeSession } = get();
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
      StorageService.saveSessions(updatedHistory);

      const updatedActive = activeSession?.id === sessionId ? removePhoto(activeSession) : activeSession;

      persistenceRepository.photos.deletePhoto(sessionId, photoId, targetPhoto?.storagePath).catch(err => {
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
      const { historySessions, activeSession } = get();
      const updateLike = (session: GameSession): GameSession => ({
        ...session,
        photos: (session.photos || []).map(p =>
          p.id === photoId ? { ...p, likes: (p.likes || 0) + 1 } : p
        )
      });

      const updatedHistory = historySessions.map(updateLike);
      StorageService.saveSessions(updatedHistory);
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
      if (persistenceRepository.isCloudConnected()) {
        try {
          const { sessions, players, stats } = await StorageService.syncFromPersistence();
          const currentActiveId = StorageService.getActiveSessionId();
          const activeSession = currentActiveId
            ? sessions.find(s => s.id === currentActiveId && s.status === 'active') || null
            : null;

          if (sessions.length > 0 || players.length > 0) {
            set({
              historySessions: sessions.length > 0 ? sessions : get().historySessions,
              playersRoster: players.length > 0 ? players : get().playersRoster,
              playerStats: Object.keys(stats).length > 0 ? stats : get().playerStats,
              activeSession: activeSession ?? get().activeSession,
              isCloudConnected: true
            });
          }
        } catch (err) {
          console.warn('[sessionStore] Failed to initialize from cloud persistence:', err);
        }
      }
    },

    clearToast: () => set({ toastMessage: null })
  };
});
