import React from 'react';
import { useSessionStore } from '../../features/session/sessionStore';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = "RUMMY 7'S",
  subtitle = "Dashboard",
  showBack = false,
  onBack
}) => {
  const { hapticsEnabled, toggleHaptics, setScreen } = useSessionStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setScreen('dashboard');
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0a0e16]/85 backdrop-blur-xl border-b border-[#3c4a42]/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] pt-safe">
      <div className="h-16 px-4 max-w-md mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack ? (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-[#dfe2ee] hover:text-[#4edea3] active:scale-95 transition-all bg-[#1c2028]/60"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back_ios_new</span>
            </button>
          ) : null}

          {/* Logo Brand Icon */}
          <div className="relative w-8 h-8 rounded-lg bg-[#1c2028] border border-[#4edea3]/30 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <span className="font-headline font-bold text-lg text-[#4edea3] leading-none">7</span>
            <span className="absolute -top-0.5 right-0 text-[10px] text-[#ffb95f]">👑</span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-sm uppercase tracking-wider text-[#dfe2ee] truncate">
                {title}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#4edea3]/10 text-[#4edea3] font-headline text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                Live
              </span>
            </div>
            <span className="font-headline text-[10px] uppercase tracking-wider text-[#bbcabf] truncate">
              {subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleHaptics}
            aria-label="Haptics Toggle"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              hapticsEnabled
                ? 'text-[#4edea3] bg-[#4edea3]/15'
                : 'text-[#86948a] bg-[#1c2028]/60'
            }`}
            title={hapticsEnabled ? "Haptics Active" : "Haptics Off"}
          >
            <span className="material-symbols-outlined text-[19px]">
              {hapticsEnabled ? 'vibration' : 'smartphone'}
            </span>
          </button>

          <div
            onClick={() => setScreen('rankings')}
            className="w-8 h-8 rounded-full bg-[#4edea3] flex items-center justify-center text-[#003824] cursor-pointer active:scale-95 transition-transform shadow-sm"
            title="Player Ledger"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
