import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1c2028] border border-[#3c4a42] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#3c4a42]/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb95f] text-2xl">menu_book</span>
            <h2 className="font-headline font-bold text-lg text-[#dfe2ee]">Game Rules & Penalties</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#262a33] text-[#bbcabf] hover:text-[#dfe2ee] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="space-y-4 text-sm font-body text-[#bbcabf]">
          {/* Core Philosophy */}
          <div className="bg-[#181c24] p-3.5 rounded-xl border border-[#3c4a42]/40">
            <h3 className="font-headline font-bold text-sm text-[#4edea3] mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">emoji_events</span>
              Lowest Total Score Wins
            </h3>
            <p className="text-xs leading-relaxed text-[#dfe2ee]">
              Like golf scoring, the player with the lowest accumulated penalty points at the conclusion of all rounds wins the tournament. Second lowest is Runner-up.
            </p>
          </div>

          {/* 7s Rummy */}
          <div className="bg-[#181c24] p-3.5 rounded-xl border border-[#3c4a42]/40">
            <h3 className="font-headline font-bold text-sm text-[#ffb95f] mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">bolt</span>
              7s Rummy (Classic)
            </h3>
            <p className="text-xs leading-relaxed mb-2">
              7 consecutive hands. Rounds 1 and 7 are high-stakes <strong>Double Penalty (2x)</strong> rounds:
            </p>
            <div className="flex items-center justify-between text-xs bg-[#0a0e16] p-2 rounded-lg font-headline text-center">
              <div><span className="text-[#ffb95f]">R1</span>: 2x</div>
              <div>R2: 1x</div>
              <div>R3: 1x</div>
              <div>R4: 1x</div>
              <div>R5: 1x</div>
              <div>R6: 1x</div>
              <div><span className="text-[#ffb95f]">R7</span>: 2x</div>
            </div>
          </div>

          {/* DICK and FULL */}
          <div className="bg-[#181c24] p-3.5 rounded-xl border border-[#3c4a42]/40">
            <h3 className="font-headline font-bold text-sm text-[#dfe2ee] mb-1">
              Score Terminology
            </h3>
            <ul className="text-xs space-y-1.5 list-disc pl-4">
              <li>
                <strong className="text-[#4edea3]">DICK:</strong> 0 penalty points! Claimed when a player successfully goes out / completes their hand first.
              </li>
              <li>
                <strong className="text-[#ff7a73]">FULL:</strong> Maximum hand penalty (standard 80 points, configurable).
              </li>
              <li>
                <strong>Custom Points:</strong> Sum of unmatched deadwood cards for mid-game count.
              </li>
            </ul>
          </div>

          {/* Tea Rule */}
          <div className="bg-[#93000a]/20 border border-[#93000a]/50 p-3.5 rounded-xl">
            <h3 className="font-headline font-bold text-sm text-[#ffb4ab] mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">local_cafe</span>
              The Sacred Tea Duty Rule
            </h3>
            <p className="text-xs leading-relaxed text-[#dfe2ee]">
              The player with the highest final total score is the tournament loser and is sentenced to <strong>Tea Duty</strong> (buying cutting chais, samosas, or snacks for the table).
            </p>
            <p className="text-xs leading-relaxed text-[#ffb4ab] mt-1.5 font-semibold">
              ☕ Tie Rule: If two or more players are tied for highest total score, ALL tied players share Tea Duty and receive teaBought + 1!
            </p>
          </div>

          {/* Table Lock */}
          <div className="bg-[#181c24] p-3.5 rounded-xl border border-[#3c4a42]/40">
            <h3 className="font-headline font-bold text-sm text-[#dfe2ee] mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">lock</span>
              Table Lock Enforced
            </h3>
            <p className="text-xs leading-relaxed text-[#bbcabf]">
              Once Round 1 starts, the table is locked. Players cannot leave or join mid-match to preserve the integrity of total score calculations and tea penalties.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#4edea3] text-[#003824] font-headline font-bold text-sm flex items-center justify-center active:scale-95 transition-all mt-2"
        >
          Got It, Back to Table
        </button>
      </div>
    </div>
  );
};
