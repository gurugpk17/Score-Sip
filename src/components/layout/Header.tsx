import React from 'react';
import { useSessionStore } from '../../features/session/sessionStore';
import { BrandLogo } from '../ui/BrandLogo';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = "SCORE & SIP",
  subtitle = "Keep the score. Enjoy the game.",
  showBack = false,
  onBack
}) => {
  const { setScreen, setMenuOpen, user, currentScreen, activeSession } = useSessionStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setScreen('dashboard');
    }
  };

  const isLiveScreen = currentScreen === 'live';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userInitials = (user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--border-subtle)] shadow-sm pt-safe transition-colors">
      <div className="h-16 px-4 max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Left: Back or Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack ? (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--brand-primary)] active:scale-95 transition-all bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
          ) : (
            <BrandLogo size={36} />
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-sm tracking-wide text-[var(--text-primary)] truncate">
                {title}
              </span>
              {isLiveScreen && activeSession && activeSession.status === 'active' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--brand-primary-bg)] text-[var(--brand-primary)] font-headline text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <span className="font-body text-[11px] text-[var(--text-muted)] truncate">
              {subtitle}
            </span>
          </div>
        </div>

        {/* Right: Menu Drawer Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open Menu"
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] active:scale-95 transition-all border border-[var(--border-subtle)] shadow-sm gap-1.5 px-2"
            title="Menu & Settings"
          >
            {user ? (
              userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Profile"
                  className="w-6 h-6 rounded-full object-cover border border-[var(--brand-primary)]/40"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-headline font-bold text-[11px] flex items-center justify-center">
                  {userInitials}
                </div>
              )
            ) : null}
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
