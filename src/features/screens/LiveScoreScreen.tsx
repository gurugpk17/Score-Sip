import React, { useState } from 'react';
import { useSessionStore } from '../session/sessionStore';
import { calculateRanking, calculateRoundScore, calculateSessionTotals } from '../../domain/scoring/engine';
import { TactileScorePad } from '../../components/score-entry/TactileScorePad';
import { triggerHaptic } from '../../lib/utils/haptics';

export const LiveScoreScreen: React.FC = () => {
  const {
    activeSession,
    activeScoringPlayerId,
    selectScoringPlayer,
    setScreen,
    finalizeSession,
    showToast
  } = useSessionStore();

  const [activeTab, setActiveTab] = useState<'entry' | 'standings'>('entry');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined text-[#ffb95f] text-5xl">casino</span>
        <h2 className="font-headline font-bold text-xl text-[#dfe2ee]">No Active Table Found</h2>
        <p className="font-body text-xs text-[#bbcabf] max-w-xs">
          Start a new game or resume a saved match from the table ledger.
        </p>
        <button
          onClick={() => setScreen('setup')}
          className="h-12 px-6 rounded-xl bg-[#4edea3] text-[#003824] font-headline font-bold text-sm uppercase"
        >
          Setup New Game
        </button>
      </div>
    );
  }

  const currentRoundNum = activeSession.currentRoundNumber;
  const totalRounds = activeSession.gameConfig.roundCount;
  const roundIdx = currentRoundNum - 1;
  const currentRound = activeSession.rounds[roundIdx];
  const multiplier = currentRound?.multiplier || 1;

  // Calculate live cumulative standings up to current state
  const sessionTotals = calculateSessionTotals(activeSession);
  const totalsList = Object.entries(sessionTotals).map(([playerId, totalScore]) => ({
    playerId,
    totalScore
  }));
  const rankings = calculateRanking(totalsList);
  const rankMap = new Map(rankings.map(r => [r.playerId, r]));

  // Find leader and tea duty risk
  const leaderRank = rankings[0];
  const leaderPlayer = activeSession.players.find(p => p.id === leaderRank?.playerId);
  const highestRank = rankings[rankings.length - 1];
  const highestPlayer = activeSession.players.find(p => p.id === highestRank?.playerId);
  const teaDutyMargin = (highestRank && leaderRank) ? highestRank.totalScore - leaderRank.totalScore : 0;

  // Identify round recap stats
  let quickDickPlayer: string | null = null;
  let maxBustPlayer: { name: string; score: number } | null = null;

  if (currentRound) {
    for (const [pId, sc] of Object.entries(currentRound.scores)) {
      if (sc && sc.entered) {
        const p = activeSession.players.find(pl => pl.id === pId);
        if (sc.baseScore === 0) {
          quickDickPlayer = p?.name || 'Player';
        }
        if (!maxBustPlayer || sc.finalScore > maxBustPlayer.score) {
          maxBustPlayer = { name: p?.name || 'Player', score: sc.finalScore };
        }
      }
    }
  }

  const toggleExpand = (playerId: string) => {
    triggerHaptic('light');
    setExpandedPlayerId(prev => prev === playerId ? null : playerId);
  };

  return (
    <div className="flex flex-col w-full pb-28 px-4 pt-1 max-w-md mx-auto select-none">
      {/* Top Segmented View Switcher */}
      <div className="bg-[#181c24] border border-[#3c4a42]/40 rounded-xl p-1 flex gap-1 mb-3 shadow-sm">
        <button
          onClick={() => {
            triggerHaptic('selection');
            setActiveTab('entry');
          }}
          className={`flex-1 py-1.5 rounded-lg font-headline text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'entry'
              ? 'bg-[#262a33] text-[#4edea3] shadow-sm'
              : 'text-[#bbcabf] hover:text-[#dfe2ee]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">edit_note</span>
          <span>Score Entry Pad</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            setActiveTab('standings');
          }}
          className={`flex-1 py-1.5 rounded-lg font-headline text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'standings'
              ? 'bg-[#262a33] text-[#4edea3] shadow-sm'
              : 'text-[#bbcabf] hover:text-[#dfe2ee]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">query_stats</span>
          <span>Live Standings</span>
        </button>
      </div>

      {/* Round & Multiplier Header Banner */}
      <div className="relative w-full rounded-2xl bg-[#1c2028] border border-[#3c4a42]/50 p-4 shadow-xl overflow-hidden mb-4">
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-[#ee9800]/20 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-[#4edea3]/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-headline text-[10px] text-[#86948a] uppercase font-bold tracking-wider">
              {activeSession.name}
            </span>
            <h2 className="font-headline font-bold text-2xl text-[#dfe2ee]">
              ROUND {currentRoundNum} OF {totalRounds}
            </h2>
          </div>

          {/* Electric Multiplier Chip */}
          {multiplier > 1 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ee9800] text-[#472a00] shadow-md shadow-[#ee9800]/30 animate-pulse">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span className="font-headline text-xs font-bold tracking-wider">
                DOUBLE ×{multiplier}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#262a33] text-[#bbcabf] border border-[#3c4a42]/50">
              <span className="material-symbols-outlined text-[16px] text-[#4edea3]">speed</span>
              <span className="font-headline text-xs font-bold tracking-wider">
                STANDARD ×1
              </span>
            </div>
          )}
        </div>

        {/* Mini Match Stakes Bar */}
        <div className="mt-3 pt-2 border-t border-[#3c4a42]/30 flex items-center justify-between text-xs font-body text-[#bbcabf]">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#ffb95f]">casino</span>
            <span>{activeSession.players.length}-Player Table</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#4edea3]">verified_user</span>
            <span>Low Score Wins</span>
          </div>
        </div>

        {/* Micro Round Progression Track */}
        <div className="grid grid-cols-7 gap-1.5 mt-3 pt-1">
          {activeSession.rounds.map((rnd) => {
            const isCompleted = rnd.isCompleted;
            const isCurrent = rnd.roundNumber === currentRoundNum;

            return (
              <div key={rnd.roundNumber} className="flex flex-col items-center gap-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-all ${
                    isCompleted
                      ? 'bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.5)]'
                      : isCurrent
                      ? 'bg-[#ffb95f] animate-pulse'
                      : 'bg-[#31353e]'
                  }`}
                />
                <span
                  className={`font-headline text-[10px] ${
                    isCompleted
                      ? 'text-[#4edea3]'
                      : isCurrent
                      ? 'text-[#ffb95f] font-bold'
                      : 'text-[#86948a]'
                  }`}
                >
                  R{rnd.roundNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TAB 1: SCORE ENTRY PAD */}
      {activeTab === 'entry' && (
        <div className="flex flex-col gap-3">
          {/* Player Cards List */}
          <div className="flex flex-col gap-2 mb-2">
            {activeSession.players.map((player) => {
              const scoreEntry = currentRound?.scores[player.id];
              const isEntered = scoreEntry?.entered;
              const isActive = activeScoringPlayerId === player.id;
              const isWonRound = isEntered && (scoreEntry.scoreType === 'dick' || scoreEntry.baseScore === 0);
              const isFullPenalty = isEntered && (scoreEntry.scoreType === 'full' || scoreEntry.baseScore >= activeSession.gameConfig.fullPenaltyValue);

              return (
                <div
                  key={player.id}
                  onClick={() => selectScoringPlayer(player.id)}
                  className={`relative w-full rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] border ${
                    isActive
                      ? 'bg-[#262a33] border-[#4edea3] shadow-lg shadow-[#4edea3]/10'
                      : isEntered
                      ? 'bg-[#181c24] border-[#3c4a42]/40 shadow-sm'
                      : 'bg-[#181c24]/60 border-[#3c4a42]/20 opacity-80'
                  }`}
                >
                  {/* Left indicator strip for active row */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#4edea3] rounded-l-2xl" />
                  )}

                  <div className="flex items-center gap-3 min-w-0 pl-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm shrink-0 shadow-md ${
                        isActive
                          ? 'bg-[#4edea3] text-[#003824]'
                          : isWonRound
                          ? 'bg-[#4edea3]/20 text-[#4edea3]'
                          : isFullPenalty
                          ? 'bg-[#93000a]/30 text-[#ffb4ab]'
                          : 'bg-[#31353e] text-[#dfe2ee]'
                      }`}
                    >
                      {player.initials}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-headline font-bold text-sm truncate ${
                          isActive ? 'text-[#4edea3]' : 'text-[#dfe2ee]'
                        }`}>
                          {player.name}
                        </span>

                        {isWonRound && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-headline font-bold bg-[#4edea3]/20 text-[#4edea3]">
                            WON ROUND
                          </span>
                        )}
                        {isFullPenalty && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-headline font-bold bg-[#93000a] text-[#ffdad6]">
                            FULL PENALTY
                          </span>
                        )}
                        {isActive && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]" />
                          </span>
                        )}
                      </div>

                      <span className="font-body text-xs text-[#86948a]">
                        {isEntered
                          ? `${scoreEntry.baseScore} base pts × ${scoreEntry.multiplier}`
                          : isActive
                          ? 'Entering score below...'
                          : 'Waiting turn'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    {isEntered ? (
                      <>
                        <span className={`px-2.5 py-0.5 rounded-full font-headline font-bold text-xs ${
                          isWonRound
                            ? 'bg-[#4edea3] text-[#003824]'
                            : isFullPenalty
                            ? 'bg-[#93000a] text-[#ffdad6]'
                            : 'bg-[#1c2028] text-[#dfe2ee]'
                        }`}>
                          {isWonRound ? 'DICK (0)' : `${scoreEntry.finalScore} pts`}
                        </span>
                        <span className="font-headline text-[10px] text-[#4edea3] flex items-center gap-0.5 mt-1 font-semibold">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span> Entered
                        </span>
                      </>
                    ) : isActive ? (
                      <span className="px-2.5 py-1 rounded bg-[#4edea3]/20 text-[#4edea3] font-headline text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">edit</span> IN PROGRESS
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-[#31353e] font-headline text-[10px] text-[#86948a] font-bold uppercase">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Tactile Score Pad */}
          <TactileScorePad />
        </div>
      )}

      {/* TAB 2: LIVE STANDINGS SCOREBOARD */}
      {activeTab === 'standings' && (
        <div className="flex flex-col gap-3">
          {/* Tea Pot Stakes Ticker (Gamified Tension Element) */}
          <div className="flex items-center justify-between rounded-2xl bg-[#1c2028] border border-[#ff7a73]/30 p-3 px-4 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#ff7a73]/20 flex items-center justify-center text-[#ff7a73] shrink-0">
                <span className="material-symbols-outlined text-[20px]">local_cafe</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline text-xs font-bold text-[#ff7a73] uppercase tracking-wider">
                    Tea Duty Radar
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#ff7a73]/20 text-[#ff7a73] font-headline text-[9px] font-bold uppercase">
                    High Risk
                  </span>
                </div>
                <span className="font-body text-xs text-[#bbcabf] truncate">
                  {highestPlayer?.name} trails by {teaDutyMargin} pts. Highest total score owes tea.
                </span>
              </div>
            </div>

            <button
              onClick={() => showToast(`☕ ${highestPlayer?.name || 'Last place'} is currently on the Hot Seat!`)}
              className="shrink-0 text-[#86948a] hover:text-[#ff7a73] p-1.5 rounded-lg active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">info</span>
            </button>
          </div>

          {/* Leaderboard Header */}
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-sm uppercase text-[#dfe2ee]">
                Live Standings
              </span>
              <span className="text-[#4edea3] font-headline text-[10px] font-bold bg-[#4edea3]/10 px-2 py-0.5 rounded-full">
                Golf Scoring
              </span>
            </div>
            <span className="font-headline text-[10px] text-[#86948a] uppercase tracking-wider font-semibold">
              Tap player for round splits
            </span>
          </div>

          {/* Standings Cards Stack */}
          <div className="flex flex-col gap-2.5">
            {rankings.map((rankItem) => {
              const player = activeSession.players.find(p => p.id === rankItem.playerId);
              if (!player) return null;

              const isFirst = rankItem.rank === 1;
              const isSecond = rankItem.rank === 2;
              const isLast = rankItem.isLoser;
              const isExpanded = expandedPlayerId === player.id;

              return (
                <div
                  key={player.id}
                  onClick={() => toggleExpand(player.id)}
                  className={`relative overflow-hidden rounded-2xl p-4 shadow-md transition-all active:scale-[0.99] cursor-pointer border ${
                    isFirst
                      ? 'bg-[#1c2028] border-[#4edea3]/50'
                      : isLast
                      ? 'bg-[#1c2028] border-[#ff7a73]/40'
                      : 'bg-[#181c24] border-[#3c4a42]/30'
                  }`}
                >
                  {/* Left accent strip */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isFirst ? 'bg-[#4edea3]' : isLast ? 'bg-[#ff7a73]' : isSecond ? 'bg-[#ffb95f]' : 'bg-[#31353e]'
                    }`}
                  />

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-headline text-base font-bold text-[#003824] shadow-inner"
                          style={{ backgroundColor: player.avatarColor || '#4edea3' }}
                        >
                          {player.initials}
                        </div>
                        {isFirst && (
                          <span className="absolute -top-1.5 -right-1.5 text-base leading-none">
                            👑
                          </span>
                        )}
                        {isLast && (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0a0e16] flex items-center justify-center text-xs">
                            ☕
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-headline font-bold text-sm text-[#dfe2ee]">
                            {player.name}
                          </span>
                          {isFirst && (
                            <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-headline text-[9px] font-bold">
                              #1 LEADER
                            </span>
                          )}
                          {isSecond && (
                            <span className="px-1.5 py-0.5 rounded bg-[#ffb95f]/20 text-[#ffb95f] font-headline text-[9px] font-bold">
                              🥈 2ND
                            </span>
                          )}
                          {isLast && (
                            <span className="px-1.5 py-0.5 rounded bg-[#ff7a73]/30 text-[#ff7a73] font-headline text-[9px] font-bold uppercase animate-pulse">
                              HOT SEAT!
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[#86948a] font-body text-xs">
                          {isFirst ? (
                            <span className="text-[#4edea3] font-headline text-[11px] font-semibold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[13px]">verified</span> Leader
                            </span>
                          ) : isLast ? (
                            <span className="text-[#ff7a73] font-headline text-[11px] font-semibold">
                              Tea Peril (+{teaDutyMargin} to safe)
                            </span>
                          ) : (
                            <span className="font-headline text-[11px]">
                              Rank #{rankItem.rank}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-headline font-bold text-3xl tabular-nums leading-none ${
                        isFirst ? 'text-[#4edea3]' : isLast ? 'text-[#ff7a73]' : 'text-[#dfe2ee]'
                      }`}>
                        {rankItem.totalScore}
                      </div>
                      <div className="mt-1 flex items-center justify-end">
                        <span className="px-1.5 py-0.5 rounded bg-[#262a33] text-[#bbcabf] font-headline text-[9px] font-bold">
                          Total PTS
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable rounds drawer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#3c4a42]/30 grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {activeSession.rounds.map((rnd) => {
                        const sc = rnd.scores[player.id];
                        const entered = sc && sc.entered;
                        const isZero = entered && sc.finalScore === 0;

                        return (
                          <div
                            key={rnd.roundNumber}
                            className={`rounded-lg p-1.5 text-center ${
                              isZero
                                ? 'bg-[#4edea3]/20 border border-[#4edea3]/40'
                                : 'bg-[#0a0e16]'
                            }`}
                          >
                            <div className="font-headline text-[9px] text-[#86948a]">
                              R{rnd.roundNumber} ({rnd.multiplier}x)
                            </div>
                            <div className={`font-headline text-xs font-bold ${
                              isZero ? 'text-[#4edea3]' : entered ? 'text-[#dfe2ee]' : 'text-[#86948a]'
                            }`}>
                              {entered ? (isZero ? '0 ★' : sc.finalScore) : '-'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Round Recap Snapshot */}
          <div className="rounded-2xl bg-[#1c2028] border border-[#3c4a42]/50 p-4 shadow-md space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb95f] text-[18px]">history_edu</span>
                <span className="font-headline font-bold text-xs uppercase text-[#dfe2ee]">
                  Round {currentRoundNum} Snapshot
                </span>
              </div>
              <span className="font-headline text-[10px] text-[#86948a]">
                {multiplier > 1 ? 'Double Penalty Hand' : 'Standard Hand'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-xl bg-[#262a33] p-2.5 border border-[#3c4a42]/30">
                <div className="flex items-center justify-between text-[#86948a]">
                  <span className="font-headline text-[9px] uppercase font-bold">Quick Dick Winner</span>
                  <span className="material-symbols-outlined text-[14px] text-[#4edea3]">military_tech</span>
                </div>
                <div className="mt-1 font-headline font-bold text-xs text-[#dfe2ee]">
                  {quickDickPlayer || 'None yet'}
                </div>
                <div className="text-[#4edea3] font-body text-[11px]">Zero points claimed</div>
              </div>

              <div className="rounded-xl bg-[#262a33] p-2.5 border border-[#3c4a42]/30">
                <div className="flex items-center justify-between text-[#86948a]">
                  <span className="font-headline text-[9px] uppercase font-bold">Maximum Bust</span>
                  <span className="material-symbols-outlined text-[14px] text-[#ff7a73]">report</span>
                </div>
                <div className="mt-1 font-headline font-bold text-xs text-[#dfe2ee]">
                  {maxBustPlayer ? `${maxBustPlayer.name} (${maxBustPlayer.score} pts)` : 'None yet'}
                </div>
                <div className="text-[#ff7a73] font-body text-[11px]">Highest hand penalty</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Dock */}
      <div className="fixed bottom-16 inset-x-0 max-w-md mx-auto p-4 z-40">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0a0e16]/92 backdrop-blur-xl border border-[#3c4a42]/40 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
          <button
            onClick={() => {
              triggerHaptic('medium');
              setActiveTab(activeTab === 'entry' ? 'standings' : 'entry');
            }}
            className="w-13 h-13 rounded-xl bg-[#262a33] hover:bg-[#353942] flex items-center justify-center text-[#dfe2ee] hover:text-[#4edea3] active:scale-95 transition-all shadow-md shrink-0 border border-[#3c4a42]/40"
            title="Toggle Standings / Entry"
          >
            <span className="material-symbols-outlined text-[22px]">
              {activeTab === 'entry' ? 'query_stats' : 'edit_note'}
            </span>
          </button>

          {/* Quick Snap Table Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              useSessionStore.getState().openAddPhotoModal(activeSession.id);
            }}
            className="w-13 h-13 rounded-xl bg-[#262a33] hover:bg-[#353942] flex items-center justify-center text-[#4edea3] active:scale-95 transition-all shadow-md shrink-0 border border-[#3c4a42]/40"
            title="Snap Card Table"
          >
            <span className="material-symbols-outlined text-[22px]">photo_camera</span>
          </button>

          {activeTab === 'standings' ? (
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('entry');
              }}
              className="flex-1 h-13 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] flex items-center justify-center gap-1.5 font-headline font-bold text-sm tracking-wide shadow-[0_4px_25px_rgba(78,222,163,0.35)] active:scale-[0.97] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Enter Round {currentRoundNum} Scores</span>
            </button>
          ) : (
            <button
              onClick={() => {
                triggerHaptic('medium');
                finalizeSession();
              }}
              className="flex-1 h-13 rounded-xl bg-[#ffb95f] hover:bg-[#ffdcb8] text-[#2a1700] flex items-center justify-center gap-1.5 font-headline font-bold text-sm tracking-wide shadow-[0_4px_25px_rgba(255,185,95,0.35)] active:scale-[0.97] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Finalize & Reveal Winner</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
