import React, { useState } from 'react';
import { useSessionStore } from '../session/sessionStore';
import { triggerHaptic } from '../../lib/utils/haptics';
import { RulesModal } from '../../components/modals/RulesModal';
import { CustomGameModal } from '../../components/modals/CustomGameModal';
import { TestRunnerModal } from '../../components/modals/TestRunnerModal';

export const DashboardScreen: React.FC = () => {
  const {
    activeSession,
    historySessions,
    playerStats,
    setScreen,
    resumeActiveSession,
    viewSessionDetails
  } = useSessionStore();

  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);

  // Host stats (e.g. Guru)
  const hostStats = playerStats['p1'] || Object.values(playerStats)[0] || {
    wins: 8,
    runnerUps: 4,
    teaBought: 3,
    winRatio: 53,
    sessionsPlayed: 15
  };

  const latestSession = historySessions[0];

  const handleStartGame = () => {
    triggerHaptic('success');
    setScreen('setup');
  };

  return (
    <div className="flex flex-col w-full px-4 py-3 gap-5 select-none pb-28">
      {/* Hero Battle Card & Primary CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1c2028] border border-[#3c4a42]/50 p-4 shadow-xl">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#4edea3]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#ffb95f]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4edea3]/15 text-[#4edea3] self-start">
                <span className="material-symbols-outlined text-[14px]">playing_cards</span>
                <span className="font-headline text-[10px] uppercase font-bold tracking-wider">
                  Tonight's Felt is Set
                </span>
              </div>
              <h1 className="font-headline font-bold text-2xl text-[#dfe2ee] leading-tight">
                Ready for another battle?
              </h1>
              <p className="font-body text-xs text-[#bbcabf]">
                Shuffle up. Deal the hands. Last place sponsors the chai round!
              </p>
            </div>

            <div className="relative w-14 h-14 rounded-2xl bg-[#262a33] border border-[#3c4a42] flex items-center justify-center shadow-inner shrink-0">
              <span className="material-symbols-outlined text-[#ffb95f] text-[30px]">style</span>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#4edea3] text-[#003824] font-headline text-xs font-bold shadow-sm">
                7
              </span>
            </div>
          </div>

          {/* Dominant Neon CTA */}
          <button
            onClick={handleStartGame}
            style={{ backgroundColor: '#4edea3', color: '#003824' }}
            className="relative group w-full h-14 rounded-xl font-headline font-bold text-base uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-150 shadow-[0_8px_24px_rgba(78,222,163,0.35)] overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4edea3]"
            id="btn-start-game"
          >
            <span className="material-symbols-outlined text-[24px]">add_circle</span>
            <span>Start New Game</span>
            <span className="material-symbols-outlined text-[20px] ml-1">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Active Draft / Paused Session Notice Banner */}
      {activeSession && activeSession.status === 'active' && (
        <div className="relative overflow-hidden rounded-xl bg-[#181c24] border border-[#ffb95f]/40 p-3 shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex shrink-0 w-10 h-10 rounded-full bg-[#ee9800]/20 items-center justify-center text-[#ffb95f]">
                <span className="material-symbols-outlined text-[22px] animate-pulse">hourglass_top</span>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ffb95f]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline text-[10px] uppercase font-bold tracking-wider text-[#ffb95f]">
                    Paused Session
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#86948a]" />
                  <span className="font-headline text-[10px] text-[#bbcabf]">
                    Round {activeSession.currentRoundNumber} of {activeSession.gameConfig.roundCount}
                  </span>
                </div>
                <p className="font-body text-xs text-[#dfe2ee] font-medium truncate">
                  {activeSession.name}
                </p>
              </div>
            </div>

            <button
              onClick={resumeActiveSession}
              className="shrink-0 px-3 py-2 rounded-lg bg-[#262a33] hover:bg-[#353942] text-[#4edea3] font-headline text-xs font-bold uppercase active:scale-95 transition-all flex items-center gap-1 border border-[#4edea3]/30"
            >
              <span>Resume</span>
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            </button>
          </div>
        </div>
      )}

      {/* Player Performance Bento Stats */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-headline text-[10px] uppercase font-bold tracking-wider text-[#bbcabf]">
            Your Player Ledger
          </span>
          <span className="font-headline text-[10px] text-[#4edea3] font-bold">
            Season 3 Live
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Stat 1: Wins */}
          <div className="relative overflow-hidden rounded-xl bg-[#1c2028] border border-[#3c4a42]/40 p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-headline text-[10px] text-[#bbcabf] font-bold uppercase">Victories</span>
              <div className="w-7 h-7 rounded-full bg-[#ffb95f]/15 flex items-center justify-center text-[#ffb95f]">
                <span className="material-symbols-outlined text-[16px]">military_tech</span>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-headline font-bold text-3xl text-[#dfe2ee] tabular-nums">
                {hostStats.wins}
              </span>
              <span className="font-headline text-xs text-[#4edea3] font-bold">Wins</span>
            </div>
            <span className="font-body text-[11px] text-[#bbcabf] mt-1">Leader of table</span>
          </div>

          {/* Stat 2: Runner-up */}
          <div className="relative overflow-hidden rounded-xl bg-[#1c2028] border border-[#3c4a42]/40 p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-headline text-[10px] text-[#bbcabf] font-bold uppercase">Podium Finishes</span>
              <div className="w-7 h-7 rounded-full bg-[#86948a]/20 flex items-center justify-center text-[#dfe2ee]">
                <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-headline font-bold text-3xl text-[#dfe2ee] tabular-nums">
                {hostStats.runnerUps}
              </span>
              <span className="font-headline text-xs text-[#bbcabf] font-bold">Silver</span>
            </div>
            <span className="font-body text-[11px] text-[#bbcabf] mt-1">Close call finishes</span>
          </div>

          {/* Stat 3: Tea Penalty */}
          <div className="relative overflow-hidden rounded-xl bg-[#1c2028] border border-[#ff7a73]/30 p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-headline text-[10px] text-[#ff7a73] font-bold uppercase">Tea Penalty</span>
              <div className="w-7 h-7 rounded-full bg-[#ff7a73]/20 flex items-center justify-center text-[#ff7a73]">
                <span className="material-symbols-outlined text-[16px]">local_cafe</span>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-headline font-bold text-3xl text-[#ff7a73] tabular-nums">
                {hostStats.teaBought}
              </span>
              <span className="font-headline text-xs text-[#ff7a73] font-bold">Bouts</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[#bbcabf]">
              <span className="material-symbols-outlined text-[13px] text-[#ff7a73]">receipt_long</span>
              <span className="font-body text-[11px] text-[#bbcabf]">Chai rounds treated</span>
            </div>
          </div>

          {/* Stat 4: Sessions & Winrate */}
          <div className="relative overflow-hidden rounded-xl bg-[#1c2028] border border-[#3c4a42]/40 p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-headline text-[10px] text-[#bbcabf] font-bold uppercase">Win Ratio</span>
              <div className="w-7 h-7 rounded-full bg-[#4edea3]/15 flex items-center justify-center text-[#4edea3]">
                <span className="material-symbols-outlined text-[16px]">query_stats</span>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-headline font-bold text-3xl text-[#4edea3] tabular-nums">
                {hostStats.winRatio}%
              </span>
            </div>
            <span className="font-body text-[11px] text-[#bbcabf] mt-1">
              {hostStats.sessionsPlayed} sessions locked
            </span>
          </div>
        </div>
      </div>

      {/* Recent Game Quick Recap */}
      {latestSession && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#4edea3]">history</span>
              <span className="font-headline text-[10px] uppercase font-bold tracking-wider text-[#bbcabf]">
                Latest Match Ledger
              </span>
            </div>
            <span className="font-body text-xs text-[#86948a]">
              {new Date(latestSession.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="rounded-2xl bg-[#1c2028] border border-[#3c4a42]/60 p-4 shadow-lg flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-headline font-bold text-base text-[#dfe2ee]">
                  {latestSession.name}
                </span>
                <span className="font-body text-xs text-[#bbcabf]">
                  {latestSession.gameConfig.name} • {latestSession.gameConfig.roundCount} Hands Total
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#31353e] text-[#bbcabf] font-headline text-[10px] font-bold uppercase">
                {latestSession.status}
              </span>
            </div>

            {/* Podium Sample Rows */}
            {latestSession.results && latestSession.results.length >= 2 ? (
              <div className="flex flex-col gap-2">
                {/* 1st Winner */}
                {latestSession.results[0] && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#262a33] border border-[#4edea3]/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#ffb95f]/20 text-[#ffb95f] flex items-center justify-center font-headline text-sm shrink-0">
                        👑
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline font-bold text-xs text-[#dfe2ee] truncate">
                          {latestSession.results[0].playerName}
                        </span>
                        <span className="font-body text-[11px] text-[#4edea3] flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px]">trending_up</span> Table Champion
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-headline font-bold text-sm text-[#4edea3] tabular-nums">
                        {latestSession.results[0].totalScore} pts
                      </span>
                      <span className="font-headline text-[9px] uppercase tracking-wider text-[#86948a]">
                        LOWEST
                      </span>
                    </div>
                  </div>
                )}

                {/* 2nd Runner Up */}
                {latestSession.results[1] && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#181c24] border border-[#3c4a42]/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#31353e] text-[#dfe2ee] flex items-center justify-center font-headline text-xs font-bold shrink-0">
                        2
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline font-bold text-xs text-[#dfe2ee] truncate">
                          {latestSession.results[1].playerName}
                        </span>
                        <span className="font-body text-[11px] text-[#bbcabf]">
                          Defended second
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-headline font-bold text-sm text-[#dfe2ee] tabular-nums">
                        {latestSession.results[1].totalScore} pts
                      </span>
                      <span className="font-headline text-[9px] text-[#86948a] uppercase">
                        Runner-up
                      </span>
                    </div>
                  </div>
                )}

                {/* Last Place: Tea Duty */}
                {latestSession.results[latestSession.results.length - 1] && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ff7a73]/15 border border-[#ff7a73]/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#ff7a73]/20 text-[#ff7a73] flex items-center justify-center font-headline text-sm shrink-0">
                        ☕
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline font-bold text-xs text-[#ffb4ab] truncate">
                          {latestSession.results[latestSession.results.length - 1].playerName}
                        </span>
                        <span className="font-body text-[11px] text-[#ffb4ab]">
                          Tea Duty Sentenced! 🫖
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-headline font-bold text-sm text-[#ff7a73] tabular-nums">
                        {latestSession.results[latestSession.results.length - 1].totalScore} pts
                      </span>
                      <span className="font-headline text-[9px] text-[#ff7a73] uppercase font-bold">
                        TEA DUTY
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Action Split */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => viewSessionDetails(latestSession.id)}
                className="h-11 rounded-xl bg-[#262a33] hover:bg-[#353942] text-[#dfe2ee] font-headline text-xs uppercase font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-[#3c4a42]/40"
              >
                <span className="material-symbols-outlined text-[18px]">receipt</span>
                <span>Breakdown</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setScreen('setup');
                }}
                className="h-11 rounded-xl bg-[#ffb95f]/15 hover:bg-[#ffb95f]/25 text-[#ffb95f] font-headline text-xs uppercase font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-[#ffb95f]/30"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                <span>Rematch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Hub */}
      <div className="flex flex-col gap-2">
        <span className="font-headline text-[10px] uppercase font-bold tracking-wider text-[#bbcabf] px-1">
          Club Quests & Ops
        </span>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Action 1: Custom Game */}
          <button
            onClick={() => setIsCustomOpen(true)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1c2028] hover:bg-[#262a33] border border-[#3c4a42]/40 active:scale-[0.98] transition-all text-left shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">tune</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline font-bold text-sm text-[#dfe2ee]">New Custom Game</span>
                <span className="font-body text-xs text-[#bbcabf] truncate">
                  Hand count, round multipliers & FULL penalty value
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#86948a] text-[20px]">chevron_right</span>
          </button>

          {/* Action 2: Rules & Penalties */}
          <button
            onClick={() => setIsRulesOpen(true)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1c2028] hover:bg-[#262a33] border border-[#3c4a42]/40 active:scale-[0.98] transition-all text-left shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#ee9800]/20 text-[#ffb95f] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">menu_book</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline font-bold text-sm text-[#dfe2ee]">Game Rules & Penalties</span>
                <span className="font-body text-xs text-[#bbcabf] truncate">
                  DICK, FULL, 7s multipliers & tea ties
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#86948a] text-[20px]">chevron_right</span>
          </button>

          {/* Action 3: Wall of Shame */}
          <button
            onClick={() => setScreen('rankings')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1c2028] hover:bg-[#262a33] border border-[#3c4a42]/40 active:scale-[0.98] transition-all text-left shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#ff7a73]/20 text-[#ff7a73] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">theater_comedy</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline font-bold text-sm text-[#dfe2ee]">Tea Duty Wall of Shame</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#ff7a73]/20 text-[#ff7a73] font-headline text-[9px] font-bold uppercase">
                    Spicy
                  </span>
                </div>
                <span className="font-body text-xs text-[#bbcabf] truncate">
                  Who owes samosas, cutting chais, and snacks
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#86948a] text-[20px]">chevron_right</span>
          </button>

          {/* Action 4: Game Night Gallery */}
          <button
            onClick={() => setScreen('gallery')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1c2028] hover:bg-[#262a33] border border-[#3c4a42]/40 active:scale-[0.98] transition-all text-left shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#4edea3]/20 text-[#4edea3] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">photo_camera</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline font-bold text-sm text-[#dfe2ee]">Game Night Gallery</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#4edea3]/20 text-[#4edea3] font-headline text-[9px] font-bold uppercase">
                    Vault
                  </span>
                </div>
                <span className="font-body text-xs text-[#bbcabf] truncate">
                  Memories, table snaps & tea moment archives
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#86948a] text-[20px]">chevron_right</span>
          </button>

          {/* Action 4: Verify Scoring Engine Tests */}
          <button
            onClick={() => setIsTestOpen(true)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1c2028] hover:bg-[#262a33] border border-[#3c4a42]/40 active:scale-[0.98] transition-all text-left shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#4edea3]/10 text-[#4edea3] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">science</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline font-bold text-sm text-[#dfe2ee]">Engine Self-Test Suite</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#4edea3]/20 text-[#4edea3] font-headline text-[9px] font-bold uppercase">
                    100% Verified
                  </span>
                </div>
                <span className="font-body text-xs text-[#bbcabf] truncate">
                  Unit tests for ACE, 7s, 5s, Custom, Tea ties & Idempotency
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#86948a] text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Table Atmosphere Footer Accent */}
      <div className="flex items-center justify-center gap-2 py-2 text-[#86948a]/70">
        <span className="material-symbols-outlined text-[15px]">lock</span>
        <span className="font-headline text-[10px] uppercase tracking-widest font-semibold">
          Local Session Encrypted • Table #07
        </span>
      </div>

      {/* Modals */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <CustomGameModal isOpen={isCustomOpen} onClose={() => setIsCustomOpen(false)} />
      <TestRunnerModal isOpen={isTestOpen} onClose={() => setIsTestOpen(false)} />
    </div>
  );
};
