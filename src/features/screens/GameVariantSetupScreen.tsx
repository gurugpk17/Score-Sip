import React, { useState } from 'react';
import { useSessionStore } from '../session/sessionStore';
import { GameVariantType } from '../../domain/models/types';
import { PRESET_GAMES } from '../../domain/scoring/rules';
import { triggerHaptic } from '../../lib/utils/haptics';
import { CustomGameModal } from '../../components/modals/CustomGameModal';

export const GameVariantSetupScreen: React.FC = () => {
  const {
    selectedVariant,
    selectVariant,
    customGameConfig,
    playersRoster,
    playerStats,
    addPlayerToRoster,
    removePlayerFromRoster,
    startNewSession,
    showToast
  } = useSessionStore();

  const [inputName, setInputName] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const game7s = PRESET_GAMES['7s']();
  const game5s = PRESET_GAMES['5s']();
  const gameAce = PRESET_GAMES['ace']();
  const gameCustom = PRESET_GAMES['custom'](customGameConfig);

  const currentGame = selectedVariant === '7s'
    ? game7s
    : selectedVariant === '5s'
    ? game5s
    : selectedVariant === 'ace'
    ? gameAce
    : gameCustom;

  // Available saved players from previous user history/stats not yet seated at the table
  const availableSavedPlayers = Object.values(playerStats)
    .map(s => s.playerName)
    .filter(name => !playersRoster.some(p => p.name.toLowerCase() === name.toLowerCase()));

  const handleAdd = () => {
    if (!inputName.trim()) return;
    const ok = addPlayerToRoster(inputName);
    if (ok) setInputName('');
  };

  const handleQuickAdd = (name: string) => {
    addPlayerToRoster(name);
  };

  const handleStart = () => {
    if (playersRoster.length < 2) {
      showToast("At least 2 players are required to start a game!");
      return;
    }
    triggerHaptic('success');
    startNewSession();
  };

  return (
    <div className="flex flex-col w-full pb-44 max-w-md mx-auto">
      {/* Game Variant Deck */}
      <div className="relative w-full px-4 pt-3 overflow-hidden">
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[var(--brand-primary)] text-[20px]">style</span>
            <h2 className="font-headline font-bold text-sm uppercase tracking-wide text-[var(--text-primary)]">
              Choose a Game
            </h2>
          </div>
          <span className="font-headline text-[10px] uppercase px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--brand-primary)] font-bold">
            4 Variants
          </span>
        </div>

        {/* Horizontal Game Selection Carousel */}
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar">
          {/* Option 1: 7s RUMMY */}
          <div
            onClick={() => selectVariant('7s')}
            className={`flex-shrink-0 w-[240px] snap-center rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98] relative overflow-hidden border ${
              selectedVariant === '7s'
                ? 'bg-[var(--bg-card)] border-[var(--brand-primary)] shadow-md'
                : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-card)]'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-headline font-bold text-lg text-[var(--text-primary)]">7s RUMMY</span>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  selectedVariant === '7s'
                    ? 'bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-bold'
                    : 'bg-[var(--bg-elevated)] text-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[13px] font-bold">check</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--brand-primary-bg)] text-[var(--brand-primary)] font-headline text-[10px] font-bold mb-2">
              <span className="material-symbols-outlined text-[12px]">stars</span>
              <span>Classic • 7 Rounds</span>
            </div>
            <p className="font-body text-xs text-[var(--text-secondary)] line-clamp-2">
              Round 1 & Round 7 double. Strategic card endurance.
            </p>
            <div className="mt-3 flex items-center gap-1 text-[var(--brand-accent)] font-headline text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              <span>2x Multiplier on R1 & R7</span>
            </div>
          </div>

          {/* Option 2: 5s RUMMY */}
          <div
            onClick={() => selectVariant('5s')}
            className={`flex-shrink-0 w-[240px] snap-center rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98] relative overflow-hidden border ${
              selectedVariant === '5s'
                ? 'bg-[var(--bg-card)] border-[var(--brand-accent)] shadow-md'
                : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-card)]'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-headline font-bold text-lg text-[var(--text-primary)]">5s RUMMY</span>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  selectedVariant === '5s'
                    ? 'bg-[var(--brand-accent)] text-[var(--brand-on-accent)] font-bold'
                    : 'bg-[var(--bg-elevated)] text-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[13px] font-bold">check</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--brand-accent-bg)] text-[var(--brand-accent)] font-headline text-[10px] font-bold mb-2">
              <span className="material-symbols-outlined text-[12px]">speed</span>
              <span>Quick Fire • 5 Rounds</span>
            </div>
            <p className="font-body text-xs text-[var(--text-secondary)] line-clamp-2">
              Fast-paced match. Round 1 & Round 5 scores double.
            </p>
            <div className="mt-3 flex items-center gap-1 text-[var(--text-secondary)] font-headline text-xs font-bold">
              <span>2x Multiplier on R1 & R5</span>
            </div>
          </div>

          {/* Option 3: ACE */}
          <div
            onClick={() => selectVariant('ace')}
            className={`flex-shrink-0 w-[240px] snap-center rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98] relative overflow-hidden border ${
              selectedVariant === 'ace'
                ? 'bg-[var(--bg-card)] border-[var(--color-danger)] shadow-md'
                : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-card)]'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-headline font-bold text-lg text-[var(--text-primary)]">ACE</span>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  selectedVariant === 'ace'
                    ? 'bg-[var(--color-danger)] text-white font-bold'
                    : 'bg-[var(--bg-elevated)] text-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[13px] font-bold">check</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-headline text-[10px] font-bold mb-2">
              <span className="material-symbols-outlined text-[12px]">layers</span>
              <span>Position Based</span>
            </div>
            <p className="font-body text-xs text-[var(--text-secondary)] line-clamp-2">
              1st: 0 pts, 2nd: 10 pts, 3rd: 20 pts, 4th: 30 pts, 5th: 40 pts.
            </p>
            <div className="mt-3 flex items-center gap-1 text-[var(--color-danger)] font-headline text-xs font-bold">
              <span>Position penalties</span>
            </div>
          </div>

          {/* Option 4: CUSTOM RUMMY */}
          <div
            onClick={() => {
              selectVariant('custom');
              setIsCustomModalOpen(true);
            }}
            className={`flex-shrink-0 w-[240px] snap-center rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98] relative overflow-hidden border ${
              selectedVariant === 'custom'
                ? 'bg-[var(--bg-card)] border-[var(--brand-primary)] shadow-md'
                : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-card)]'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-headline font-bold text-lg text-[var(--text-primary)]">CUSTOM</span>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  selectedVariant === 'custom'
                    ? 'bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-bold'
                    : 'bg-[var(--bg-elevated)] text-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[13px] font-bold">tune</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-headline text-[10px] font-bold mb-2">
              <span className="material-symbols-outlined text-[12px]">tune</span>
              <span>House Rules</span>
            </div>
            <p className="font-body text-xs text-[var(--text-secondary)] line-clamp-2">
              {gameCustom.roundCount} rounds, custom multipliers & FULL penalty.
            </p>
            <div className="mt-3 flex items-center gap-1 text-[var(--brand-primary)] font-headline text-xs font-bold">
              <span>Configure Rules →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Player Setup Section */}
      <div className="w-full px-4 mt-4">
        {/* Table Header Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[var(--brand-accent)] text-[20px]">groups</span>
            <h2 className="font-headline font-bold text-sm uppercase tracking-wide text-[var(--text-primary)]">
              Player Table
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
            <span className="font-headline text-xs text-[var(--text-primary)] font-bold" id="player-count-indicator">
              {playersRoster.length} Seated
            </span>
          </div>
        </div>

        {/* Active Player Roster List */}
        {playersRoster.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-card)] text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-[var(--text-muted)]">person_add</span>
            <span className="font-headline font-bold text-sm text-[var(--text-primary)]">
              Table is Empty
            </span>
            <p className="font-body text-xs text-[var(--text-secondary)] max-w-xs">
              Add at least 2 players below to set the table and get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2" id="player-list">
            {playersRoster.map((player, idx) => {
              const isHost = idx === 0;

              return (
                <div
                  key={player.id}
                  className="player-row group flex items-center justify-between p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl transition-all duration-150 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-headline text-sm font-bold text-[#003824] shadow-md"
                        style={{ backgroundColor: player.avatarColor || '#4edea3' }}
                      >
                        {player.initials}
                      </div>
                      {isHost && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--brand-accent)] text-[var(--brand-on-accent)] flex items-center justify-center text-[10px] font-bold shadow">
                          👑
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline font-bold text-sm text-[var(--text-primary)] leading-tight">
                          {player.name}
                        </span>
                        {isHost && (
                          <span className="font-headline text-[9px] px-1.5 py-0.5 rounded bg-[var(--brand-accent-bg)] text-[var(--brand-accent)] uppercase font-bold tracking-wider">
                            Host
                          </span>
                        )}
                      </div>
                      <span className="font-body text-xs text-[var(--text-muted)]">
                        Seat #{player.seatNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pr-1">
                    <button
                      onClick={() => removePlayerFromRoster(player.id)}
                      aria-label={`Remove ${player.name}`}
                      className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--color-danger-bg)] text-[var(--text-muted)] hover:text-[var(--color-danger)] flex items-center justify-center transition-colors active:scale-90"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Add Player Input */}
        <div className="mt-3 bg-[var(--bg-card)] border border-[var(--border-card)] p-3 rounded-2xl flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[20px]">
                person_add
              </span>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                }}
                maxLength={20}
                placeholder="Enter player name..."
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-body text-sm focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                id="quick-player-input"
              />
            </div>
            <button
              onClick={handleAdd}
              className="h-11 px-4 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--brand-primary)] text-[var(--brand-primary)] hover:text-[var(--brand-on-primary)] font-headline font-bold text-sm flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              Add
            </button>
          </div>

          {/* User's Saved Roster Chips (if any available) */}
          {availableSavedPlayers.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
              <span className="font-headline text-[10px] text-[var(--text-muted)] uppercase tracking-wider pl-1 whitespace-nowrap">
                Saved:
              </span>
              {availableSavedPlayers.slice(0, 6).map((savedName) => (
                <button
                  key={savedName}
                  onClick={() => handleQuickAdd(savedName)}
                  className="px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:text-[var(--brand-primary)] text-xs font-headline font-semibold whitespace-nowrap active:scale-95 transition-transform flex items-center gap-1"
                >
                  <span>+</span> {savedName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Action Bar positioned above BottomNav dock */}
      <div className="fixed bottom-16 inset-x-0 max-w-md mx-auto p-3 bg-[var(--nav-bg)] backdrop-blur-xl border-t border-[var(--border-subtle)] z-40 shadow-lg transition-colors">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="font-headline text-[11px] uppercase text-[var(--text-secondary)] font-bold tracking-widest" id="summary-game-mode">
            {currentGame.name} • {currentGame.roundCount} ROUNDS
          </span>
          <span className="font-headline text-[11px] text-[var(--brand-primary)] font-bold" id="summary-multiplier">
            {selectedVariant === '7s'
              ? 'R1 & R7 DOUBLE'
              : selectedVariant === '5s'
              ? 'R1 & R5 DOUBLE'
              : selectedVariant === 'ace'
              ? 'PROGRESSIVE PTS'
              : 'CUSTOM MULTIPLIERS'}
          </span>
        </div>

        <button
          onClick={handleStart}
          className="relative w-full h-14 rounded-2xl bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-headline font-bold text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
        >
          <span className="material-symbols-outlined text-[24px]">play_circle</span>
          <span id="start-btn-label">
            START SESSION ({playersRoster.length} PLAYERS)
          </span>
        </button>
      </div>

      <CustomGameModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
      />
    </div>
  );
};
