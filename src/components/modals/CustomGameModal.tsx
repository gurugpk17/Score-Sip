import React, { useState } from 'react';
import { useSessionStore } from '../../features/session/sessionStore';
import { STANDARD_FULL_VALUE } from '../../domain/scoring/rules';

interface CustomGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomGameModal: React.FC<CustomGameModalProps> = ({ isOpen, onClose }) => {
  const { customGameConfig, setCustomGameConfig, selectVariant, setScreen } = useSessionStore();

  const [name, setName] = useState(customGameConfig.name || 'Friday House Rules');
  const [roundCount, setRoundCount] = useState(customGameConfig.roundCount || 6);
  const [firstMult, setFirstMult] = useState(customGameConfig.multipliers?.[0] || 2);
  const [lastMult, setLastMult] = useState(
    customGameConfig.multipliers?.[(customGameConfig.multipliers?.length || 6) - 1] || 2
  );
  const [defaultMult, setDefaultMult] = useState(1);
  const [fullPenalty, setFullPenalty] = useState(customGameConfig.fullPenaltyValue || STANDARD_FULL_VALUE);

  if (!isOpen) return null;

  const handleSaveAndUse = () => {
    // Generate multipliers array
    const multipliers = Array.from({ length: roundCount }, (_, i) => {
      if (i === 0) return firstMult;
      if (i === roundCount - 1) return lastMult;
      return defaultMult;
    });

    setCustomGameConfig({
      name,
      roundCount,
      multipliers,
      fullPenaltyValue: fullPenalty,
      description: `${roundCount} hands with custom multipliers [${multipliers.join(', ')}] and FULL = ${fullPenalty} pts.`
    });

    selectVariant('custom');
    onClose();
    setScreen('setup');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4 text-[var(--color-text)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-2xl">tune</span>
            <h2 className="font-headline font-bold text-lg text-[var(--color-text)]">Configure Custom Rummy</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Game Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-headline text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Game / Tournament Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] font-body text-sm focus:outline-none focus:border-[var(--color-primary)]"
              placeholder="e.g. Midnight High Stakes"
            />
          </div>

          {/* Number of Rounds */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="font-headline text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Total Rounds ({roundCount})
              </label>
              <span className="font-headline text-xs text-[var(--color-primary)] font-bold">{roundCount} Hands</span>
            </div>

            {/* Stepper with Direct Input */}
            <div className="flex items-center gap-3 bg-[var(--color-bg)] p-2 rounded-xl border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setRoundCount(Math.max(1, roundCount - 1))}
                className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] hover:opacity-90 text-[var(--color-text)] font-headline text-xl font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 flex flex-col items-center">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={roundCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setRoundCount(Math.max(1, Math.min(50, val)));
                  }}
                  className="w-20 text-center font-headline font-bold text-2xl text-[var(--color-primary)] bg-transparent focus:outline-none"
                />
                <span className="font-headline text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                  Configured Rounds
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRoundCount(Math.min(50, roundCount + 1))}
                className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] hover:opacity-90 text-[var(--color-text)] font-headline text-xl font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {[3, 5, 7, 10, 12, 14, 15, 20, 25].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setRoundCount(count)}
                  style={roundCount === count ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' } : undefined}
                  className={`px-3 py-1.5 rounded-lg font-headline text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    roundCount === count
                      ? 'shadow-sm'
                      : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Multiplier Configuration */}
          <div className="bg-[var(--color-surface-elevated)] p-3 rounded-xl border border-[var(--color-border)] space-y-3">
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] block">
              Round Multipliers
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[var(--color-text-muted)]">Round 1 Mult</span>
                <select
                  value={firstMult}
                  onChange={(e) => setFirstMult(Number(e.target.value))}
                  className="h-9 px-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-headline text-[var(--color-text)]"
                >
                  <option value={1}>1x (Normal)</option>
                  <option value={2}>2x (Double)</option>
                  <option value={3}>3x (Triple)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[var(--color-text-muted)]">Middle Mult</span>
                <select
                  value={defaultMult}
                  onChange={(e) => setDefaultMult(Number(e.target.value))}
                  className="h-9 px-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-headline text-[var(--color-text)]"
                >
                  <option value={1}>1x (Normal)</option>
                  <option value={2}>2x (Double)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[var(--color-text-muted)]">Final Round Mult</span>
                <select
                  value={lastMult}
                  onChange={(e) => setLastMult(Number(e.target.value))}
                  className="h-9 px-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-headline text-[var(--color-text)]"
                >
                  <option value={1}>1x (Normal)</option>
                  <option value={2}>2x (Double)</option>
                  <option value={3}>3x (Triple)</option>
                </select>
              </div>
            </div>
          </div>

          {/* FULL Penalty Value */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-headline text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                "FULL" Penalty Value
              </label>
              <span className="font-headline text-xs text-[#c93b2b] font-bold">{fullPenalty} Points</span>
            </div>
            <div className="flex items-center gap-2">
              {[40, 60, 80, 100, 120].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFullPenalty(val)}
                  className={`flex-1 h-9 rounded-lg font-headline text-xs font-bold transition-all ${
                    fullPenalty === val
                      ? 'bg-[#c93b2b] text-white shadow-sm'
                      : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveAndUse}
          className="w-full h-12 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] font-headline font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all mt-3 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">play_arrow</span>
          Save & Launch Table
        </button>
      </div>
    </div>
  );
};
