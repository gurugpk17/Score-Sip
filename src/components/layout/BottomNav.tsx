import React from 'react';
import { ScreenView, useSessionStore } from '../../features/session/sessionStore';

interface NavItem {
  key: ScreenView | 'menu';
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Home', icon: 'home' },
  { key: 'live', label: 'Game', icon: 'playing_cards' },
  { key: 'ledger', label: 'History', icon: 'history' },
  { key: 'rankings', label: 'Stats', icon: 'leaderboard' },
  { key: 'menu', label: 'Menu', icon: 'menu' }
];

export const BottomNav: React.FC = () => {
  const { currentScreen, setScreen, activeSession, setMenuOpen } = useSessionStore();

  // Hide BottomNav during live score entry to maximize focus and touch keypad ergonomics
  if (currentScreen === 'live') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[var(--nav-bg)] backdrop-blur-xl border-t border-[var(--border-subtle)] shadow-lg transition-colors">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            (item.key === 'dashboard' && currentScreen === 'dashboard') ||
            (item.key === 'live' && (currentScreen === 'live' || currentScreen === 'setup' || currentScreen === 'results')) ||
            (item.key === 'ledger' && (currentScreen === 'ledger' || currentScreen === 'game-details')) ||
            (item.key === 'rankings' && currentScreen === 'rankings');

          return (
            <button
              key={item.key}
              onClick={() => {
                if (item.key === 'menu') {
                  setMenuOpen(true);
                } else if (item.key === 'live') {
                  if (activeSession && activeSession.status === 'active') {
                    setScreen('live');
                  } else {
                    setScreen('setup');
                  }
                } else {
                  setScreen(item.key as ScreenView);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] h-14 flex-1 transition-all active:scale-95 ${
                isActive
                  ? 'text-[var(--brand-primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">
                  {item.icon}
                </span>
                {item.key === 'live' && activeSession && activeSession.status === 'active' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-ping" />
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
