import React, { useState } from 'react';
import { useSessionStore } from '../session/sessionStore';
import { triggerHaptic } from '../../lib/utils/haptics';

export const LedgerHistoryScreen: React.FC = () => {
  const { historySessions, viewGameDetails, setScreen } = useSessionStore();
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');

  const filteredSessions = historySessions.filter(s => {
    if (filter === 'completed') return s.status === 'completed';
    if (filter === 'active') return s.status === 'active';
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-28 px-4 pt-2 max-w-md mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4edea3] text-2xl">history</span>
          <div>
            <h2 className="font-headline font-bold text-lg text-[#dfe2ee]">Match Ledger</h2>
            <p className="font-body text-xs text-[#bbcabf]">
              {historySessions.length} recorded game nights in ledger
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 bg-[#181c24] border border-[#3c4a42]/40 rounded-xl p-1">
          {(['all', 'completed', 'active'] as const).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => {
                triggerHaptic('light');
                setFilter(tabKey);
              }}
              className={`px-2.5 py-1 rounded-lg font-headline text-[10px] font-bold uppercase transition-all ${
                filter === tabKey
                  ? 'bg-[#262a33] text-[#4edea3]'
                  : 'text-[#bbcabf] hover:text-[#dfe2ee]'
              }`}
            >
              {tabKey}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-3">
        {filteredSessions.map((session) => {
          const isCompleted = session.status === 'completed';
          const winner = session.results?.find(r => r.isWinner);
          const teaLoser = session.results?.find(r => r.isTeaDuty);
          const photosCount = session.photos?.length || 0;
          const dateStr = new Date(session.startedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          return (
            <div
              key={session.id}
              onClick={() => viewGameDetails(session.id)}
              className="bg-[#1c2028] hover:bg-[#262a33] border border-[#3c4a42]/50 rounded-2xl p-4 shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline font-bold text-base text-[#dfe2ee]">
                      {session.name}
                    </h3>
                    <span className={`px-2 py-0.2 rounded-full font-headline text-[9px] font-bold uppercase ${
                      isCompleted
                        ? 'bg-[#4edea3]/15 text-[#4edea3]'
                        : 'bg-[#ee9800]/20 text-[#ffb95f]'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <span className="font-body text-xs text-[#86948a] mt-0.5 block">
                    {session.gameConfig.name} • {session.gameConfig.roundCount} Hands • {dateStr}
                  </span>
                </div>

                <span className="material-symbols-outlined text-[#86948a] text-xl">
                  chevron_right
                </span>
              </div>

              {/* Roster & Final Highlights */}
              {isCompleted && session.results ? (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#3c4a42]/30">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👑</span>
                    <div className="flex flex-col">
                      <span className="font-headline text-[10px] text-[#86948a] uppercase">Winner</span>
                      <span className="font-headline font-bold text-xs text-[#4edea3]">
                        {winner?.playerName} ({winner?.totalScore} pts)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base">☕</span>
                    <div className="flex flex-col">
                      <span className="font-headline text-[10px] text-[#86948a] uppercase">Tea Duty</span>
                      <span className="font-headline font-bold text-xs text-[#ff7a73]">
                        {teaLoser?.playerName} ({teaLoser?.totalScore} pts)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-[#ffb95f] pt-1 border-t border-[#3c4a42]/30 font-headline font-semibold">
                  <span>Match paused at Round {session.currentRoundNumber}</span>
                  <span className="underline">Tap to Resume →</span>
                </div>
              )}

              {/* Photos & Roster Strip */}
              <div className="flex items-center justify-between pt-1 border-t border-[#3c4a42]/20">
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-[#86948a] font-headline mr-1">Roster:</span>
                  {session.players.map(p => (
                    <span
                      key={p.id}
                      className="px-2 py-0.5 rounded-full bg-[#181c24] text-[#bbcabf] font-headline text-[10px] border border-[#3c4a42]/30"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>

                {photosCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4edea3]/10 text-[#4edea3] font-headline text-[10px] font-bold shrink-0">
                    <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                    <span>{photosCount} {photosCount === 1 ? 'photo' : 'photos'}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-[#86948a] font-headline flex items-center gap-0.5 shrink-0">
                    <span className="material-symbols-outlined text-[12px]">add_a_photo</span>
                    <span>Add photo</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="text-center py-12 text-[#86948a] font-body text-xs">
            No sessions match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
