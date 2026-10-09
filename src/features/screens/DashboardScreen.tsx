import React from 'react';
import { useSessionStore } from '../session/sessionStore';
import { triggerHaptic } from '../../lib/utils/haptics';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { RulesModal } from '../../components/modals/RulesModal';
import { CustomGameModal } from '../../components/modals/CustomGameModal';

export const DashboardScreen: React.FC = () => {
  const {
    activeSession,
    historySessions,
    setScreen,
    resumeActiveSession,
    viewSessionDetails,
    isRulesOpen,
    setRulesOpen,
    isCustomGameOpen,
    setCustomGameOpen
  } = useSessionStore();

  const latestCompletedSession = historySessions.find(s => s.status === 'completed') || historySessions[0];

  const handleStartNewGame = () => {
    triggerHaptic('success');
    setScreen('setup');
  };

  const handleContinueGame = () => {
    triggerHaptic('medium');
    resumeActiveSession();
  };

  const handlePreviousGames = () => {
    triggerHaptic('selection');
    setScreen('ledger');
  };

  return (
    <div className="flex flex-col w-full px-5 py-6 gap-6 select-none max-w-md mx-auto">
      {/* Brand Identity Hero Banner */}
      <div className="flex flex-col items-center text-center pt-2 pb-1 gap-3">
        <BrandLogo size={56} />
        <div className="flex flex-col gap-1">
          <h1 className="font-headline font-bold text-3xl tracking-tight text-[var(--text-primary)]">
            Score &amp; Sip
          </h1>
          <p className="font-body text-sm text-[var(--text-secondary)] font-medium">
            Keep the score. Enjoy the game.
          </p>
        </div>
      </div>

      {/* Primary Action Buttons Hub */}
      <div className="flex flex-col gap-3.5 pt-2">
        {/* 1. Start New Game (Dominant Primary Button) */}
        <button
          onClick={handleStartNewGame}
          id="btn-start-game"
          className="w-full h-14 rounded-2xl bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-headline font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
        >
          <span className="material-symbols-outlined text-[24px]">add_circle</span>
          <span>Start New Game</span>
        </button>

        {/* 2. Continue Game — ONLY when current user has active game */}
        {activeSession && activeSession.status === 'active' && (
          <button
            onClick={handleContinueGame}
            id="btn-continue-game"
            className="w-full p-4 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--brand-accent)] text-[var(--text-primary)] font-headline flex items-center justify-between gap-3 active:scale-[0.98] transition-all shadow-md group hover:bg-[var(--bg-card-hover)] cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-accent-bg)] text-[var(--brand-accent)] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px] animate-pulse">play_arrow</span>
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-wide text-[var(--brand-accent)] uppercase">
                    Continue Game
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" />
                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    Round {activeSession.currentRoundNumber} of {activeSession.gameConfig.roundCount}
                  </span>
                </div>
                <span className="font-body text-xs text-[var(--text-secondary)] truncate">
                  {activeSession.name} ({activeSession.players.length} Players)
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[22px] text-[var(--brand-accent)] shrink-0">
              chevron_right
            </span>
          </button>
        )}

        {/* 3. Previous Games */}
        <button
          onClick={handlePreviousGames}
          id="btn-previous-games"
          className="w-full h-13 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[var(--text-primary)] font-headline font-semibold text-sm tracking-wide flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] text-[var(--text-muted)]">history</span>
          <span>Previous Games</span>
        </button>
      </div>

      {/* Compact Recent Game Summary (Optional calm recap) */}
      {latestCompletedSession && (
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-headline text-[11px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
              Recent Game
            </span>
            <span className="font-body text-xs text-[var(--text-muted)]">
              {new Date(latestCompletedSession.startedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>

          <div
            onClick={() => viewSessionDetails(latestCompletedSession.id)}
            className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition-all shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--brand-primary)] shrink-0 font-headline font-bold text-sm">
                🏆
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline font-bold text-sm text-[var(--text-primary)] truncate">
                  {latestCompletedSession.name}
                </span>
                <span className="font-body text-xs text-[var(--text-muted)] truncate">
                  {latestCompletedSession.results && latestCompletedSession.results[0]
                    ? `Winner: ${latestCompletedSession.results[0].playerName} (${latestCompletedSession.results[0].totalScore} pts)`
                    : `${latestCompletedSession.gameConfig.name} • ${latestCompletedSession.gameConfig.roundCount} Rounds`}
                </span>
              </div>
            </div>

            <span className="material-symbols-outlined text-[20px] text-[var(--text-muted)]">
              chevron_right
            </span>
          </div>
        </div>
      )}

      {/* Global Modals for Rules & Custom Game */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setRulesOpen(false)} />
      <CustomGameModal isOpen={isCustomGameOpen} onClose={() => setCustomGameOpen(false)} />
    </div>
  );
};
