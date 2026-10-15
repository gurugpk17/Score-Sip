import React, { useState } from 'react';
import { useSessionStore } from '../session/sessionStore';
import { triggerHaptic } from '../../lib/utils/haptics';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { RulesModal } from '../../components/modals/RulesModal';
import { CustomGameModal } from '../../components/modals/CustomGameModal';

export const DashboardScreen: React.FC = () => {
  const {
    user,
    signInWithGoogle,
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

  const [guestNoticeDismissed, setGuestNoticeDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('score_sip_guest_notice_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const latestCompletedSession = historySessions.find(s => s.status === 'completed');

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

      {/* Guest Mode Notice & Google Sign-In Prompt (Priority 5) */}
      {!user && !guestNoticeDismissed && (
        <div className="rounded-2xl p-4 bg-[var(--bg-card)] border border-[var(--border-card)] shadow-sm flex flex-col gap-3 transition-all relative">
          <button
            onClick={() => {
              triggerHaptic('light');
              setGuestNoticeDismissed(true);
              try { localStorage.setItem('score_sip_guest_notice_dismissed', 'true'); } catch {}
            }}
            className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg cursor-pointer"
            title="Dismiss notice"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary-bg)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">person_outline</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline font-bold text-xs uppercase tracking-wider text-[var(--brand-primary)]">
                Playing as Guest
              </span>
              <p className="font-body text-xs text-[var(--text-secondary)] mt-0.5">
                Matches are kept locally for 72 hours. Continue with Google to keep your history, stats, and photos permanently in the cloud.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                triggerHaptic('medium');
                signInWithGoogle();
              }}
              className="flex-1 h-9 rounded-xl bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setGuestNoticeDismissed(true);
                try { localStorage.setItem('score_sip_guest_notice_dismissed', 'true'); } catch {}
              }}
              className="h-9 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-headline font-semibold text-xs active:scale-95 transition-all cursor-pointer"
            >
              Play as Guest
            </button>
          </div>
        </div>
      )}

      {/* Primary Action Buttons Hub */}
      <div className="flex flex-col gap-3.5 pt-1">
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
