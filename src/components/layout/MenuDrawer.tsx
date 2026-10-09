import React from 'react';
import { useSessionStore } from '../../features/session/sessionStore';
import { BrandLogo } from '../ui/BrandLogo';
import { triggerHaptic } from '../../lib/utils/haptics';

export const MenuDrawer: React.FC = () => {
  const {
    isMenuOpen,
    setMenuOpen,
    currentScreen,
    setScreen,
    user,
    signInWithGoogle,
    signOut,
    theme,
    toggleTheme,
    hapticsEnabled,
    toggleHaptics,
    setRulesOpen,
    isCloudConnected
  } = useSessionStore();

  if (!isMenuOpen) return null;

  const navigateTo = (screen: Parameters<typeof setScreen>[0]) => {
    triggerHaptic('selection');
    setScreen(screen);
    setMenuOpen(false);
  };

  const userDisplayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Player';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dim Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Drawer Panel */}
      <aside className="relative w-full max-w-xs h-full bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] text-[var(--text-primary)] shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <BrandLogo size={32} showText tagline />
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close Menu"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-muted)]/50">
          {user ? (
            <div className="flex items-center gap-3">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userDisplayName}
                  className="w-11 h-11 rounded-full object-cover border border-[var(--brand-primary)]/40 shadow-sm"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-headline font-bold text-base flex items-center justify-center shadow-sm">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-headline font-bold text-sm text-[var(--text-primary)] truncate">
                  {userDisplayName}
                </span>
                <span className="font-body text-xs text-[var(--text-muted)] truncate">
                  {userEmail}
                </span>
                <span className="font-headline text-[10px] text-[var(--brand-primary)] font-semibold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
                  Google Connected
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                <span className="font-body text-xs">Guest Mode (Local Storage)</span>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  signInWithGoogle();
                }}
                className="w-full h-10 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[var(--text-primary)] font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-4 flex flex-col gap-1">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 transition-colors text-left ${
              currentScreen === 'dashboard'
                ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-semibold'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            <span className="font-headline text-sm font-semibold">Home</span>
          </button>

          <button
            onClick={() => navigateTo('rankings')}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 transition-colors text-left ${
              currentScreen === 'rankings'
                ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-semibold'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">emoji_events</span>
            <span className="font-headline text-sm font-semibold">My Stats</span>
          </button>

          <button
            onClick={() => navigateTo('setup')}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 transition-colors text-left ${
              currentScreen === 'setup'
                ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-semibold'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span className="font-headline text-sm font-semibold">Players & Table Setup</span>
          </button>

          <button
            onClick={() => navigateTo('ledger')}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 transition-colors text-left ${
              currentScreen === 'ledger'
                ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-semibold'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
            <span className="font-headline text-sm font-semibold">Game History</span>
          </button>

          <button
            onClick={() => navigateTo('gallery')}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 transition-colors text-left ${
              currentScreen === 'gallery'
                ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-semibold'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">photo_library</span>
            <span className="font-headline text-sm font-semibold">Game Memories</span>
          </button>

          <div className="my-2 border-t border-[var(--border-subtle)]" />

          {/* Preferences Section */}
          <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] font-headline">
            Preferences & Tools
          </div>

          {/* Appearance Toggle */}
          <div className="w-full h-12 px-3 rounded-xl flex items-center justify-between text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="font-headline text-sm">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-headline font-semibold text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-all"
            >
              Switch
            </button>
          </div>

          {/* Haptic Feedback Toggle */}
          <div className="w-full h-12 px-3 rounded-xl flex items-center justify-between text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">
                {hapticsEnabled ? 'vibration' : 'mobile_off'}
              </span>
              <div className="flex flex-col">
                <span className="font-headline text-sm">Haptic Feedback</span>
                <span className="text-[10px] text-[var(--text-muted)]">Tactile vibrations on taps</span>
              </div>
            </div>
            <button
              onClick={toggleHaptics}
              className={`px-2.5 py-1 rounded-lg border text-xs font-headline font-semibold transition-all ${
                hapticsEnabled
                  ? 'bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              {hapticsEnabled ? 'On' : 'Off'}
            </button>
          </div>

          {/* Rules & Penalties */}
          <button
            onClick={() => {
              setMenuOpen(false);
              setRulesOpen(true);
            }}
            className="w-full h-11 px-3 rounded-xl flex items-center gap-3 transition-colors text-left text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            <span className="font-headline text-sm font-semibold">Rules & Penalties</span>
          </button>
        </div>

        {/* Footer info & sign out */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex flex-col gap-3 bg-[var(--bg-muted)]/30">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-body">
            <span>Score &amp; Sip v2.0</span>
            <span className="flex items-center gap-1 text-[var(--brand-primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
              {isCloudConnected ? 'Cloud Active' : 'Offline Mode'}
            </span>
          </div>

          {user && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                signOut();
                setMenuOpen(false);
              }}
              className="w-full h-9 rounded-xl border border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
