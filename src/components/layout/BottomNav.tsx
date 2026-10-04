import React from 'react';
import { ScreenView, useSessionStore } from '../../features/session/sessionStore';

interface NavItem {
  key: ScreenView;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Table', icon: 'dashboard' },
  { key: 'live', label: 'Live', icon: 'casino' },
  { key: 'ledger', label: 'Ledger', icon: 'history' },
  { key: 'rankings', label: 'Rankings', icon: 'emoji_events' },
  { key: 'gallery', label: 'Gallery', icon: 'photo_library' }
];

export const BottomNav: React.FC = () => {
  const { currentScreen, setScreen, activeSession } = useSessionStore();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#0a0e16]/92 backdrop-blur-xl border-t border-[#3c4a42]/30 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.key || 
            (item.key === 'live' && currentScreen === 'setup') ||
            (item.key === 'live' && currentScreen === 'results');

          return (
            <button
              key={item.key}
              onClick={() => {
                if (item.key === 'live') {
                  if (activeSession && activeSession.status === 'active') {
                    setScreen('live');
                  } else {
                    setScreen('setup');
                  }
                } else {
                  setScreen(item.key);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] h-12 flex-1 transition-all active:scale-95 ${
                isActive
                  ? 'text-[#4edea3] font-semibold'
                  : 'text-[#bbcabf] hover:text-[#dfe2ee]'
              }`}
            >
              <div className="relative">
                <span className="material-symbols-outlined text-[22px]">
                  {item.icon}
                </span>
                {item.key === 'live' && activeSession && activeSession.status === 'active' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
                )}
              </div>
              <span className="font-headline text-[11px] uppercase tracking-wider">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
