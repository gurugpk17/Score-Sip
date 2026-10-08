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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1c2028] border border-[#3c4a42] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#3c4a42]/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-2xl">tune</span>
            <h2 className="font-headline font-bold text-lg text-[#dfe2ee]">Configure Custom Rummy</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#262a33] text-[#bbcabf] hover:text-[#dfe2ee] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Game Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-headline text-xs font-bold uppercase tracking-wider text-[#bbcabf]">
              Game / Tournament Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-[#262a33] border border-[#3c4a42] text-[#dfe2ee] font-body text-sm focus:outline-none focus:border-[#4edea3]"
              placeholder="e.g. Midnight High Stakes"
            />
          </div>

          {/* Number of Rounds */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="font-headline text-xs font-bold uppercase tracking-wider text-[#bbcabf]">
                Total Rounds ({roundCount})
              </label>
              <span className="font-headline text-xs text-[#4edea3] font-bold">{roundCount} Hands</span>
            </div>

            {/* Stepper with Direct Input */}
            <div className="flex items-center gap-3 bg-[#0a0e16] p-2 rounded-xl border border-[#3c4a42]/40">
              <button
                type="button"
                onClick={() => setRoundCount(Math.max(1, roundCount - 1))}
                className="w-10 h-10 rounded-lg bg-[#262a33] hover:bg-[#353942] text-[#dfe2ee] font-headline text-xl font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
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
                  className="w-20 text-center font-headline font-bold text-2xl text-[#4edea3] bg-transparent focus:outline-none"
                />
                <span className="font-headline text-[10px] text-[#86948a] uppercase tracking-wider">
                  Configured Rounds
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRoundCount(Math.min(50, roundCount + 1))}
                className="w-10 h-10 rounded-lg bg-[#262a33] hover:bg-[#353942] text-[#dfe2ee] font-headline text-xl font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
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
                  style={roundCount === count ? { backgroundColor: '#4edea3', color: '#003824' } : undefined}
                  className={`px-3 py-1.5 rounded-lg font-headline text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    roundCount === count
                      ? 'bg-[#4edea3] text-[#003824] shadow-sm'
                      : 'bg-[#262a33] text-[#bbcabf] hover:bg-[#353942]'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Multiplier Configuration */}
          <div className="bg-[#181c24] p-3 rounded-xl border border-[#3c4a42]/40 space-y-3">
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-[#ffb95f] block">
              Round Multipliers
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#bbcabf]">Round 1 Mult</span>
                <select
                  value={firstMult}
                  onChange={(e) => setFirstMult(Number(e.target.value))}
                  className="h-9 px-2 rounded-lg bg-[#262a33] border border-[#3c4a42] text-xs font-headline text-[#dfe2ee]"
                >
                  <option value={1}>1x (Normal)</option>
                  <option value={2}>2x (Double)</option>
                  <option value={3}>3x (Triple)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#bbcabf]">Middle Mult</span>
                <select
                  value={defaultMult}
                  onChange={(e) => setDefaultMult(Number(e.target.value))}
                  className="h-9 px-2 rounded-lg bg-[#262a33] border border-[#3c4a42] text-xs font-headline text-[#dfe2ee]"
                >
                  <option value={1}>1x (Normal)</option>
                  <option value={2}>2x (Double)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#bbcabf]">Final Round Mult</span>
                <select
                  value={lastMult}
                  onChange={(e) => setLastMult(Number(e.target.value))}
                  className="h-9 px-2 rounded-lg bg-[#262a33] border border-[#3c4a42] text-xs font-headline text-[#dfe2ee]"
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
              <label className="font-headline text-xs font-bold uppercase tracking-wider text-[#bbcabf]">
                "FULL" Penalty Value
              </label>
              <span className="font-headline text-xs text-[#ff7a73] font-bold">{fullPenalty} Points</span>
            </div>
            <div className="flex items-center gap-2">
              {[40, 60, 80, 100, 120].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFullPenalty(val)}
                  className={`flex-1 h-9 rounded-lg font-headline text-xs font-bold transition-all ${
                    fullPenalty === val
                      ? 'bg-[#ff7a73] text-[#410004]'
                      : 'bg-[#262a33] text-[#bbcabf] hover:bg-[#353942]'
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
          className="w-full h-12 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-headline font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all mt-3"
        >
          <span className="material-symbols-outlined text-lg">play_arrow</span>
          Save & Launch Table
        </button>
      </div>
    </div>
  );
};
