import React from 'react';
import { useSessionStore } from '../../features/session/sessionStore';
import { calculateRoundScore } from '../../domain/scoring/engine';
import { triggerHaptic } from '../../lib/utils/haptics';

export const TactileScorePad: React.FC = () => {
  const {
    activeSession,
    activeScoringPlayerId,
    baseScoreInput,
    activeScoreType,
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
  const multiplier = currentRound?.multiplier || 1;
  const fullPenaltyValue = activeSession.gameConfig.fullPenaltyValue || 80;
  const finalScore = calculateRoundScore(baseScoreInput, multiplier);

  return (
    <div className="w-full rounded-2xl bg-[#262a33] border border-[#3c4a42]/60 shadow-2xl p-4 relative overflow-hidden">
      {/* Sheet Drag Cue */}
      <div className="w-10 h-1 rounded-full bg-[#3c4a42] mx-auto mb-3" />

      {/* Active Player Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#4edea3]/20 text-[#4edea3] flex items-center justify-center font-headline text-xs font-bold">
            {scoringPlayer.initials}
          </div>
          <h3 className="font-headline font-bold text-sm text-[#dfe2ee]">
            Enter Score: {scoringPlayer.name}
          </h3>
        </div>

        {multiplier > 1 ? (
          <span className="font-headline text-[11px] font-bold uppercase bg-[#ee9800]/20 text-[#ffb95f] px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <span className="material-symbols-outlined text-[13px]">bolt</span>
            {multiplier}x Active
          </span>
        ) : (
          <span className="font-headline text-[11px] bg-[#1c2028] text-[#bbcabf] px-2 py-0.5 rounded-full">
            Standard 1x
          </span>
        )}
      </div>

      {/* Live Calculation Display Card */}
      <div className="w-full rounded-xl bg-[#0a0e16] p-3 mb-3 border border-[#1c2028] shadow-inner flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <div className="flex flex-col">
            <span className="font-headline text-[10px] uppercase tracking-wider text-[#86948a]">BASE</span>
            <span className="font-headline font-bold text-3xl text-[#dfe2ee] tabular-nums">
              {baseScoreInput}
            </span>
          </div>
          <span className="font-headline font-bold text-lg text-[#ffb95f]">×</span>
          <div className="flex flex-col">
            <span className="font-headline text-[10px] uppercase tracking-wider text-[#86948a]">MULT</span>
            <span className="font-headline font-bold text-xl text-[#ffb95f] tabular-nums">
              {multiplier}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="font-headline text-[10px] uppercase tracking-widest text-[#4edea3] font-bold">
            Round Score
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-headline font-bold text-3xl text-[#4edea3] tabular-nums">
              {finalScore}
            </span>
            <span className="font-headline text-xs font-bold text-[#4edea3]">PTS</span>
          </div>
        </div>
      </div>

      {/* Quick Action Macro Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Flawless Round DICK (0) */}
        <button
          onClick={setDickScore}
          className={`h-12 rounded-xl transition-all flex items-center justify-center gap-1.5 font-headline font-bold text-sm shadow-sm active:scale-95 cursor-pointer ${
            activeScoreType === 'dick' && baseScoreInput === 0
              ? 'bg-[#4edea3] text-[#003824] shadow-[0_0_12px_rgba(78,222,163,0.4)]'
              : 'bg-[#4edea3]/15 text-[#4edea3] hover:bg-[#4edea3]/25'
          }`}
        >
          <span className="material-symbols-outlined text-[19px]">military_tech</span>
          <span>DICK</span>
        </button>

        {/* Maximum Penalty FULL */}
        <button
          onClick={setFullScore}
          className={`h-12 rounded-xl transition-all flex items-center justify-center gap-1.5 font-headline font-bold text-sm shadow-sm active:scale-95 cursor-pointer ${
            activeScoreType === 'full'
              ? 'bg-[#93000a] text-[#ffdad6] shadow-[0_0_12px_rgba(255,180,171,0.3)]'
              : 'bg-[#93000a]/30 text-[#ffb4ab] hover:bg-[#93000a]/40'
          }`}
        >
          <span className="material-symbols-outlined text-[19px]">warning</span>
          <span>FULL</span>
        </button>
      </div>

      {/* Tactile Numpad Grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => appendDigitToScore(digit)}
            className="h-13 rounded-xl bg-[#1c2028] hover:bg-[#353942] active:scale-95 active:bg-[#4edea3]/20 transition-all font-headline font-bold text-xl text-[#dfe2ee] flex items-center justify-center shadow-sm select-none"
          >
            {digit}
          </button>
        ))}

        <button
          onClick={backspaceScore}
          aria-label="Backspace"
          className="h-13 rounded-xl bg-[#181c24] hover:bg-[#353942] active:scale-95 transition-all text-[#bbcabf] flex items-center justify-center shadow-sm"
        >
          <span className="material-symbols-outlined text-[22px]">backspace</span>
        </button>

        <button
          onClick={() => appendDigitToScore('0')}
          className="h-13 rounded-xl bg-[#1c2028] hover:bg-[#353942] active:scale-95 active:bg-[#4edea3]/20 transition-all font-headline font-bold text-xl text-[#dfe2ee] flex items-center justify-center shadow-sm select-none"
        >
          0
        </button>

        <button
          onClick={clearScore}
          className="h-13 rounded-xl bg-[#181c24] hover:bg-[#353942] active:scale-95 transition-all font-headline font-bold text-xs uppercase tracking-wider text-[#ffb4ab] flex items-center justify-center shadow-sm"
        >
          CLEAR
        </button>
      </div>

      {/* Primary Confirm CTA Button */}
      <button
        onClick={() => {
          triggerHaptic('success');
          confirmPlayerScore();
        }}
        className="w-full h-14 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-headline font-bold text-base flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(78,222,163,0.35)] active:scale-[0.98] transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined text-[24px]">check</span>
        <span>CONFIRM SCORE ({finalScore})</span>
      </button>

      {/* Subtext helper note */}
      <p className="font-body text-xs text-center text-[#86948a] mt-2 flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-[13px] text-[#4edea3]">auto_awesome</span>
        {multiplier > 1
          ? `Base score multiplied by ${multiplier}x automatically`
          : "Low score wins! Record hand penalty"}
      </p>
    </div>
  );
};
