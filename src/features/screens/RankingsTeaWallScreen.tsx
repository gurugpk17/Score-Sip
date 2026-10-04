import React, { useState } from 'react';
import { useSessionStore } from '../session/sessionStore';
import { triggerHaptic } from '../../lib/utils/haptics';

export const RankingsTeaWallScreen: React.FC = () => {
  const { playerStats } = useSessionStore();
  const [tab, setTab] = useState<'leaderboard' | 'teaWall'>('leaderboard');

  const statsList = Object.values(playerStats);
  
  // Sorted for Champions (most wins, then lowest average score)
  const sortedChampions = [...statsList].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.averageScore - b.averageScore;
  });

  // Sorted for Tea Wall of Shame (most tea bought!)
  const sortedTeaWall = [...statsList].sort((a, b) => b.teaBought - a.teaBought);

  return (
    <div className="flex flex-col w-full pb-28 px-4 pt-2 max-w-md mx-auto select-none">
      {/* Segmented Switcher */}
      <div className="bg-[#181c24] border border-[#3c4a42]/40 rounded-xl p-1 flex gap-1 mb-4 shadow-sm">
        <button
          onClick={() => {
            triggerHaptic('selection');
            setTab('leaderboard');
          }}
          className={`flex-1 py-2 rounded-lg font-headline text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
            tab === 'leaderboard'
              ? 'bg-[#262a33] text-[#4edea3] shadow-sm'
              : 'text-[#bbcabf] hover:text-[#dfe2ee]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">emoji_events</span>
          <span>Hall of Champions</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            setTab('teaWall');
          }}
          className={`flex-1 py-2 rounded-lg font-headline text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
            tab === 'teaWall'
              ? 'bg-[#262a33] text-[#ff7a73] shadow-sm'
              : 'text-[#bbcabf] hover:text-[#dfe2ee]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">theater_comedy</span>
          <span>Tea Wall of Shame</span>
        </button>
      </div>

      {/* TAB 1: HALL OF CHAMPIONS */}
      {tab === 'leaderboard' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-headline text-[10px] text-[#bbcabf] uppercase font-bold tracking-wider">
              All-Time Table Champions
            </span>
            <span className="font-headline text-[10px] text-[#4edea3] font-bold">
              Ranked by Victories
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {sortedChampions.map((stat, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;

              return (
                <div
                  key={stat.playerId}
                  className={`p-4 rounded-2xl border transition-all ${
                    isFirst
                      ? 'bg-[#1c2028] border-[#ffb95f]/50 shadow-lg'
                      : 'bg-[#181c24] border-[#3c4a42]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-headline text-lg font-bold ${
                          isFirst
                            ? 'bg-[#ffb95f]/20 text-[#ffb95f]'
                            : isSecond
                            ? 'bg-[#31353e] text-[#dfe2ee]'
                            : 'bg-[#1c2028] text-[#86948a]'
                        }`}>
                          {stat.playerName.charAt(0).toUpperCase()}
                        </div>
                        {isFirst && (
                          <span className="absolute -top-1.5 -right-1.5 text-base">👑</span>
                        )}
                        {isSecond && (
                          <span className="absolute -top-1.5 -right-1.5 text-sm">🥈</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-headline font-bold text-base text-[#dfe2ee]">
                            {stat.playerName}
                          </h3>
                          {isFirst && (
                            <span className="font-headline text-[9px] px-1.5 py-0.2 rounded bg-[#ffb95f]/20 text-[#ffb95f] font-bold uppercase">
                              #1 Reigning
                            </span>
                          )}
                        </div>
                        <span className="font-body text-xs text-[#86948a]">
                          {stat.sessionsPlayed} sessions • {stat.winRatio}% win rate
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-headline font-bold text-2xl text-[#4edea3] tabular-nums">
                        {stat.wins}
                      </div>
                      <span className="font-headline text-[9px] text-[#86948a] uppercase font-bold">
                        WINS
                      </span>
                    </div>
                  </div>

                  {/* Micro stats strip */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#3c4a42]/30 text-center font-headline">
                    <div className="bg-[#0a0e16] p-2 rounded-xl">
                      <span className="text-[9px] text-[#86948a] uppercase block">Podium</span>
                      <span className="text-xs font-bold text-[#dfe2ee]">{stat.runnerUps} Silver</span>
                    </div>
                    <div className="bg-[#0a0e16] p-2 rounded-xl">
                      <span className="text-[9px] text-[#86948a] uppercase block">Avg Score</span>
                      <span className="text-xs font-bold text-[#4edea3]">{stat.averageScore} pts</span>
                    </div>
                    <div className="bg-[#0a0e16] p-2 rounded-xl">
                      <span className="text-[9px] text-[#86948a] uppercase block">Best Night</span>
                      <span className="text-xs font-bold text-[#ffb95f]">{stat.bestScore} pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TEA WALL OF SHAME */}
      {tab === 'teaWall' && (
        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#93000a]/40 to-[#1c2028] border border-[#ff7a73]/40 p-4 shadow-xl mb-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#93000a]/40 text-[#ff7a73] flex items-center justify-center text-2xl shrink-0">
                ☕
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-[#dfe2ee]">
                  Official Chai & Samosa Ledger
                </h3>
                <p className="font-body text-xs text-[#ffb4ab]">
                  "A debt incurred on the rummy felt is paid in cutting chai."
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {sortedTeaWall.map((stat, idx) => {
              const isKingOfTea = idx === 0;

              return (
                <div
                  key={stat.playerId}
                  className={`p-4 rounded-2xl border transition-all ${
                    isKingOfTea
                      ? 'bg-[#1c2028] border-[#ff7a73]/60 shadow-lg'
                      : 'bg-[#181c24] border-[#3c4a42]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-headline text-lg font-bold ${
                          isKingOfTea
                            ? 'bg-[#ff7a73]/30 text-[#ff7a73]'
                            : 'bg-[#262a33] text-[#dfe2ee]'
                        }`}>
                          {stat.playerName.charAt(0).toUpperCase()}
                        </div>
                        {isKingOfTea && (
                          <span className="absolute -bottom-1 -right-1 text-sm">🫖</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-headline font-bold text-base text-[#dfe2ee]">
                            {stat.playerName}
                          </h3>
                          {isKingOfTea && (
                            <span className="font-headline text-[9px] px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-bold uppercase animate-pulse">
                              CHAI MASTER
                            </span>
                          )}
                        </div>
                        <span className="font-body text-xs text-[#86948a]">
                          {stat.teaBought * 5} cutting chais sponsored to date
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-headline font-bold text-3xl text-[#ff7a73] tabular-nums">
                        {stat.teaBought}
                      </div>
                      <span className="font-headline text-[9px] text-[#ff7a73] uppercase font-bold">
                        BOUTS
                      </span>
                    </div>
                  </div>

                  {/* Roast quote / estimate */}
                  <div className="bg-[#0a0e16] p-2.5 rounded-xl border border-[#3c4a42]/30 text-xs flex items-center justify-between text-[#bbcabf]">
                    <span className="font-body text-xs">
                      {isKingOfTea
                        ? "👑 Permanent VIP customer at Raju Tapri"
                        : stat.teaBought > 1
                        ? "Sponsored afternoon refreshments"
                        : "Escaped most penalties with cautious drops"}
                    </span>
                    <span className="font-headline font-bold text-[#ffb95f] shrink-0 ml-2">
                      Est. ₹{stat.teaBought * 120}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
