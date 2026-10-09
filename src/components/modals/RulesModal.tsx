import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4 text-[var(--color-text)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-accent)] text-2xl">menu_book</span>
            <h2 className="font-headline font-bold text-lg text-[var(--color-text)]">Game Rules & Penalties</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="space-y-4 text-sm font-body text-[var(--color-text-muted)]">
          {/* Core Philosophy */}
          <div className="bg-[var(--color-surface-elevated)] p-3.5 rounded-xl border border-[var(--color-border)]">
            <h3 className="font-headline font-bold text-sm text-[var(--color-primary)] mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">emoji_events</span>
              Lowest Total Score Wins
            </h3>
            <p className="text-xs leading-relaxed text-[var(--color-text)]">
              The player with the lowest accumulated penalty points at the conclusion of all rounds wins the game. Second lowest is Runner-up.
            </p>
          </div>

          {/* 7s Rummy */}
          <div className="bg-[var(--color-surface-elevated)] p-3.5 rounded-xl border border-[var(--color-border)]">
            <h3 className="font-headline font-bold text-sm text-[var(--color-accent)] mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">bolt</span>
              7s Rummy (Classic)
            </h3>
            <p className="text-xs leading-relaxed mb-2 text-[var(--color-text)]">
              7 consecutive hands. Rounds 1 and 7 are high-stakes <strong>Double Penalty (2x)</strong> rounds:
            </p>
            <div className="flex items-center justify-between text-xs bg-[var(--color-bg)] p-2 rounded-lg font-headline text-center border border-[var(--color-border)] text-[var(--color-text)]">
              <div><span className="text-[var(--color-accent)] font-bold">R1</span>: 2x</div>
              <div>R2: 1x</div>
              <div>R3: 1x</div>
              <div>R4: 1x</div>
              <div>R5: 1x</div>
              <div>R6: 1x</div>
              <div><span className="text-[var(--color-accent)] font-bold">R7</span>: 2x</div>
            </div>
          </div>

          {/* DICK and FULL */}
          <div className="bg-[var(--color-surface-elevated)] p-3.5 rounded-xl border border-[var(--color-border)]">
            <h3 className="font-headline font-bold text-sm text-[var(--color-text)] mb-1">
              Score Terminology
            </h3>
            <ul className="text-xs space-y-1.5 list-disc pl-4 text-[var(--color-text)]">
              <li>
                <strong className="text-[var(--color-primary)]">DICK:</strong> 0 penalty points. Awarded when a player goes out first.
              </li>
              <li>
                <strong className="text-[#c93b2b]">FULL:</strong> Maximum hand penalty (standard 80 points, configurable).
              </li>
              <li>
                <strong>Custom Points:</strong> Sum of unmatched deadwood cards for mid-game count.
              </li>
            </ul>
          </div>

          {/* Tea Rule */}
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] p-3.5 rounded-xl">
            <h3 className="font-headline font-bold text-sm text-[#c93b2b] mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">local_cafe</span>
              Tea Duty Rule
            </h3>
            <p className="text-xs leading-relaxed text-[var(--color-text)]">
              The player with the highest final total score is on <strong>Tea Duty</strong> (buying tea, coffee, or snacks for the players).
            </p>
            <p className="text-xs leading-relaxed text-[var(--color-accent)] mt-1.5 font-semibold">
              ☕ Tie Rule: If two or more players are tied for highest total score, all tied players share Tea Duty.
            </p>
          </div>

          {/* Table Lock */}
          <div className="bg-[var(--color-surface-elevated)] p-3.5 rounded-xl border border-[var(--color-border)]">
            <h3 className="font-headline font-bold text-sm text-[var(--color-text)] mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">lock</span>
              Table Lock
            </h3>
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
              Once Round 1 starts, the table is locked. Players cannot leave or join mid-match to preserve the integrity of total score calculations and tea penalties.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-headline font-bold text-sm flex items-center justify-center active:scale-95 transition-all mt-2"
        >
          Got It, Back to Table
        </button>
      </div>
    </div>
  );
};
