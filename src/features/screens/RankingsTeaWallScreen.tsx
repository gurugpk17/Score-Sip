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
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-1 flex gap-1 mb-4 shadow-sm">
        <button
          onClick={() => {
            triggerHaptic('selection');
            setTab('leaderboard');
          }}
          className={`flex-1 py-2.5 rounded-xl font-headline text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
            tab === 'leaderboard'
              ? 'bg-[var(--bg-elevated)] text-[var(--brand-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
          className={`flex-1 py-2.5 rounded-xl font-headline text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
            tab === 'teaWall'
              ? 'bg-[var(--bg-elevated)] text-[var(--color-danger)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">local_cafe</span>
          <span>Tea Duty Wall</span>
        </button>
      </div>

      {statsList.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center flex flex-col items-center gap-2 mt-4 shadow-sm">
          <span className="material-symbols-outlined text-[36px] text-[var(--text-muted)]">query_stats</span>
          <span className="font-headline font-bold text-base text-[var(--text-primary)]">
            No Statistics Yet
          </span>
          <p className="font-body text-xs text-[var(--text-secondary)] max-w-xs">
            Start and complete games to track victories, runner-up finishes, and tea penalties.
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: HALL OF CHAMPIONS */}
          {tab === 'leaderboard' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-headline text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                  Player Standings
                </span>
                <span className="font-headline text-[10px] text-[var(--brand-primary)] font-bold">
                  Ranked by Wins
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
                          ? 'bg-[var(--bg-card)] border-[var(--brand-accent)] shadow-md'
                          : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-headline text-lg font-bold ${
                              isFirst
                                ? 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent)]'
                                : isSecond
                                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
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
                              <h3 className="font-headline font-bold text-base text-[var(--text-primary)]">
                                {stat.playerName}
                              </h3>
                              {isFirst && (
                                <span className="font-headline text-[9px] px-1.5 py-0.5 rounded bg-[var(--brand-accent-bg)] text-[var(--brand-accent)] font-bold uppercase">
                                  Champion
                                </span>
                              )}
                            </div>
                            <span className="font-body text-xs text-[var(--text-muted)]">
                              {stat.sessionsPlayed} games played
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-headline font-bold text-3xl text-[var(--brand-primary)] tabular-nums">
                            {stat.wins}
                          </div>
                          <span className="font-headline text-[9px] text-[var(--brand-primary)] uppercase font-bold">
                            WINS
                          </span>
                        </div>
                      </div>

                      {/* Stat Breakdown Grid */}
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)]">
                        <div className="flex flex-col items-center p-1.5 rounded-lg bg-[var(--bg-elevated)]">
                          <span className="font-headline text-[9px] text-[var(--text-muted)] uppercase">Runner Up</span>
                          <span className="font-headline font-bold text-xs text-[var(--text-primary)] tabular-nums">
                            {stat.runnerUps}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-1.5 rounded-lg bg-[var(--bg-elevated)]">
                          <span className="font-headline text-[9px] text-[var(--text-muted)] uppercase">Win Rate</span>
                          <span className="font-headline font-bold text-xs text-[var(--brand-primary)] tabular-nums">
                            {stat.winRatio}%
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-1.5 rounded-lg bg-[var(--bg-elevated)]">
                          <span className="font-headline text-[9px] text-[var(--text-muted)] uppercase">Avg Score</span>
                          <span className="font-headline font-bold text-xs text-[var(--text-primary)] tabular-nums">
                            {stat.averageScore}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-1.5 rounded-lg bg-[var(--bg-elevated)]">
                          <span className="font-headline text-[9px] text-[var(--color-danger)] uppercase">Tea Duty</span>
                          <span className="font-headline font-bold text-xs text-[var(--color-danger)] tabular-nums">
                            {stat.teaBought}
                          </span>
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
              <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--color-danger)]/30 p-4 shadow-sm mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center text-2xl shrink-0">
                    ☕
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-base text-[var(--text-primary)]">
                      Tea Duty Ledger
                    </h3>
                    <p className="font-body text-xs text-[var(--text-secondary)]">
                      Track chai rounds treated and snack penalties.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {sortedTeaWall.map((stat, idx) => {
                  const isTopTea = idx === 0 && stat.teaBought > 0;

                  return (
                    <div
                      key={stat.playerId}
                      className={`p-4 rounded-2xl border transition-all ${
                        isTopTea
                          ? 'bg-[var(--bg-card)] border-[var(--color-danger)]/60 shadow-md'
                          : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-headline text-lg font-bold ${
                              isTopTea
                                ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                            }`}>
                              {stat.playerName.charAt(0).toUpperCase()}
                            </div>
                            {isTopTea && (
                              <span className="absolute -bottom-1 -right-1 text-sm">🫖</span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-headline font-bold text-base text-[var(--text-primary)]">
                                {stat.playerName}
                              </h3>
                              {isTopTea && (
                                <span className="font-headline text-[9px] px-2 py-0.5 rounded bg-[var(--color-danger-bg)] text-[var(--color-danger)] font-bold uppercase">
                                  Top Host
                                </span>
                              )}
                            </div>
                            <span className="font-body text-xs text-[var(--text-muted)]">
                              {stat.teaBought} rounds treated
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-headline font-bold text-3xl text-[var(--color-danger)] tabular-nums">
                            {stat.teaBought}
                          </div>
                          <span className="font-headline text-[9px] text-[var(--color-danger)] uppercase font-bold">
                            TEA DUTIES
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
