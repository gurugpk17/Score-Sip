import React from 'react';
import { useSessionStore } from '../../features/session/sessionStore';
import { calculateRoundScore, getAvailableAcePositions } from '../../domain/scoring/engine';
import { triggerHaptic } from '../../lib/utils/haptics';

export const TactileScorePad: React.FC = () => {
  const {
    activeSession,
    activeScoringPlayerId,
    baseScoreInput,
    activeScoreType,
    setBaseScore,
    appendDigitToScore,
    backspaceScore,
    clearScore,
    setDickScore,
    setFullScore,
    confirmPlayerScore
  } = useSessionStore();

  if (!activeSession || !activeScoringPlayerId) return null;

  const scoringPlayer = activeSession.players.find(p => p.id === activeScoringPlayerId);
  if (!scoringPlayer) return null;

  const currentRound = activeSession.rounds[activeSession.currentRoundNumber - 1];
  if (!currentRound) return null;

  const multiplier = currentRound?.multiplier || 1;
  const isAce = activeSession.gameConfig.variant === 'ace';
  const finalScore = isAce ? baseScoreInput : calculateRoundScore(baseScoreInput, multiplier);

  // Dynamic ACE finishing positions: 1..N based on activeSession.players.length
  const acePositionOptions = isAce
    ? getAvailableAcePositions(currentRound, activeSession.players.length, activeScoringPlayerId)
    : [];

  const currentPlayerScoreEntry = currentRound.scores[activeScoringPlayerId];
  const hasEnteredBefore = Boolean(currentPlayerScoreEntry?.entered);

  // In ACE mode, check if the currently selected baseScoreInput matches an available position
  const selectedAceOption = isAce
    ? acePositionOptions.find(opt => opt.points === baseScoreInput && opt.isAvailable)
    : undefined;

  const isAceConfirmedAllowed = isAce
    ? Boolean(selectedAceOption)
    : true;

  const getPositionLabel = (pos: number) => {
    if (pos === 1) return '🥇 1st Place';
    if (pos === 2) return '🥈 2nd Place';
    if (pos === 3) return '🥉 3rd Place';
    return `${pos}th Place`;
  };

  return (
    <div className="w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl p-4 relative overflow-hidden transition-colors">
      {/* Sheet Drag Cue */}
      <div className="w-10 h-1 rounded-full bg-[var(--text-muted)] opacity-40 mx-auto mb-3" />

      {/* Active Player Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            style={{ backgroundColor: scoringPlayer.avatarColor || 'var(--brand-primary)' }}
            className="w-7 h-7 rounded-full text-[var(--brand-on-primary)] flex items-center justify-center font-headline text-xs font-bold shadow-sm"
          >
            {scoringPlayer.initials}
          </div>
          <h3 className="font-headline font-bold text-sm text-[var(--text-primary)]">
            Enter Score: {scoringPlayer.name}
          </h3>
        </div>

        {multiplier > 1 ? (
          <span className="font-headline text-[11px] font-bold uppercase bg-[var(--brand-accent-bg)] text-[var(--brand-accent)] px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse border border-[var(--brand-accent)]/30">
            <span className="material-symbols-outlined text-[13px]">bolt</span>
            {multiplier}x Active
          </span>
        ) : (
          <span className="font-headline text-[11px] bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-2.5 py-0.5 rounded-full border border-[var(--border-subtle)]">
            Standard 1x
          </span>
        )}
      </div>

      {/* Live Calculation Display Card */}
      <div className="w-full rounded-xl bg-[var(--bg-app)] p-3 mb-3 border border-[var(--border-subtle)] shadow-inner flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <div className="flex flex-col">
            <span className="font-headline text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              {isAce ? 'FINISHING PTS' : 'BASE'}
            </span>
            <span className="font-headline font-bold text-3xl text-[var(--text-primary)] tabular-nums">
              {baseScoreInput}
            </span>
          </div>
          {!isAce && (
            <>
              <span className="font-headline font-bold text-lg text-[var(--brand-accent)]">×</span>
              <div className="flex flex-col">
                <span className="font-headline text-[10px] uppercase tracking-wider text-[var(--text-muted)]">MULT</span>
                <span className="font-headline font-bold text-xl text-[var(--brand-accent)] tabular-nums">
                  {multiplier}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-end">
          <span className="font-headline text-[10px] uppercase tracking-widest text-[var(--brand-primary)] font-bold">
            Round Score
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-headline font-bold text-3xl text-[var(--brand-primary)] tabular-nums">
              {finalScore}
            </span>
            <span className="font-headline text-xs font-bold text-[var(--brand-primary)]">PTS</span>
          </div>
        </div>
      </div>

      {/* DYNAMIC ACE FINISHING POSITIONS (Priority 2) */}
      {isAce ? (
        <div className="mb-3 flex flex-col gap-2 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="font-headline text-[11px] uppercase font-bold tracking-wider text-[var(--brand-primary)] flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">military_tech</span>
              Dynamic Finishing Positions ({activeSession.players.length} Players)
            </span>
            <span className="font-headline text-[10px] text-[var(--text-muted)]">
              Unique 1 per player
            </span>
          </div>

          {/* Dynamic Grid: 1..N based on activeSession.players.length */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-0.5">
            {acePositionOptions.map((opt) => {
              const isTakenByOther = !opt.isAvailable;
              const isSelected = selectedAceOption?.position === opt.position;
              const claimantPlayer = isTakenByOther
                ? activeSession.players.find(p => p.id === opt.takenByPlayerId)
                : undefined;

              return (
                <button
                  key={opt.position}
                  type="button"
                  disabled={isTakenByOther}
                  onClick={() => {
                    if (isTakenByOther) return;
                    triggerHaptic('selection');
                    setBaseScore(opt.points);
                  }}
                  className={`min-h-12 p-2 rounded-xl font-headline font-bold text-xs flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-md ring-2 ring-[var(--brand-primary)]'
                      : isTakenByOther
                      ? 'bg-[var(--bg-app)] opacity-50 border border-dashed border-[var(--border-subtle)] cursor-not-allowed'
                      : 'bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] active:scale-95 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{getPositionLabel(opt.position)}</span>
                  </div>

                  {isTakenByOther ? (
                    <span className="text-[10px] font-semibold text-[var(--color-danger)] truncate max-w-full mt-0.5">
                      Taken: {claimantPlayer?.name || 'Player'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-normal opacity-90 mt-0.5">
                      {opt.points} PTS
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Helper feedback for active player */}
          <div className="text-[11px] font-body text-[var(--text-secondary)] text-center pt-1 border-t border-[var(--border-subtle)]">
            {selectedAceOption ? (
              <span className="text-[var(--brand-primary)] font-semibold flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Selected: {getPositionLabel(selectedAceOption.position)} ({selectedAceOption.points} pts)
              </span>
            ) : (
              <span className="text-[var(--text-muted)]">
                Select an available finishing position for {scoringPlayer.name}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* RUMMY SCORE ENTRY (DICK / FULL macros + Numpad) */
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Flawless Round DICK (0) */}
            <button
              onClick={setDickScore}
              className={`h-12 rounded-xl transition-all flex items-center justify-center gap-1.5 font-headline font-bold text-sm shadow-sm active:scale-95 cursor-pointer ${
                activeScoreType === 'dick' && baseScoreInput === 0
                  ? 'bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-md'
                  : 'bg-[var(--brand-primary-bg)] text-[var(--brand-primary)] hover:opacity-90'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">military_tech</span>
              <span>DICK (0)</span>
            </button>

            {/* Maximum Penalty FULL */}
            <button
              onClick={setFullScore}
              className={`h-12 rounded-xl transition-all flex items-center justify-center gap-1.5 font-headline font-bold text-sm shadow-sm active:scale-95 cursor-pointer ${
                activeScoreType === 'full'
                  ? 'bg-[var(--color-danger)] text-white shadow-md'
                  : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] hover:opacity-90'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">warning</span>
              <span>FULL ({activeSession.gameConfig.fullPenaltyValue || 80})</span>
            </button>
          </div>

          {/* Tactile Numpad Grid */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => appendDigitToScore(digit)}
                className="h-13 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-subtle)] transition-all font-headline font-bold text-xl text-[var(--text-primary)] flex items-center justify-center shadow-sm select-none cursor-pointer"
              >
                {digit}
              </button>
            ))}

            <button
              onClick={backspaceScore}
              aria-label="Backspace"
              className="h-13 rounded-xl bg-[var(--bg-app)] hover:bg-[var(--bg-elevated)] active:scale-95 border border-[var(--border-subtle)] transition-all text-[var(--text-secondary)] flex items-center justify-center shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">backspace</span>
            </button>

            <button
              onClick={() => appendDigitToScore('0')}
              className="h-13 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-subtle)] transition-all font-headline font-bold text-xl text-[var(--text-primary)] flex items-center justify-center shadow-sm select-none cursor-pointer"
            >
              0
            </button>

            <button
              onClick={clearScore}
              className="h-13 rounded-xl bg-[var(--bg-app)] hover:bg-[var(--bg-elevated)] active:scale-95 border border-[var(--border-subtle)] transition-all font-headline font-bold text-xs uppercase tracking-wider text-[var(--color-danger)] flex items-center justify-center shadow-sm cursor-pointer"
            >
              CLEAR
            </button>
          </div>
        </>
      )}

      {/* Primary Confirm CTA Button */}
      <button
        disabled={isAce && !isAceConfirmedAllowed}
        onClick={() => {
          if (isAce && !isAceConfirmedAllowed) return;
          triggerHaptic('success');
          confirmPlayerScore();
        }}
        className={`w-full h-14 rounded-xl font-headline font-bold text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer ${
          isAce && !isAceConfirmedAllowed
            ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed opacity-60 border border-[var(--border-subtle)]'
            : 'bg-[var(--brand-primary)] text-[var(--brand-on-primary)] hover:opacity-95'
        }`}
      >
        <span className="material-symbols-outlined text-[24px]">check</span>
        <span>
          {isAce
            ? selectedAceOption
              ? `CONFIRM ${getPositionLabel(selectedAceOption.position).toUpperCase()} (${finalScore} PTS)`
              : `SELECT POSITION FOR ${scoringPlayer.name.toUpperCase()}`
            : `CONFIRM SCORE (${finalScore} PTS)`}
        </span>
      </button>

      {/* Subtext helper note */}
      <p className="font-body text-xs text-center text-[var(--text-muted)] mt-2 flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-[13px] text-[var(--brand-primary)]">auto_awesome</span>
        {isAce
          ? "Positions 1 to N are dynamic & unique. Formula: (Position - 1) × 10"
          : multiplier > 1
          ? `Base score multiplied by ${multiplier}x automatically`
          : "Low score wins! Record hand penalty"}
      </p>
    </div>
  );
};
