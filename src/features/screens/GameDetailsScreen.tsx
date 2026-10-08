import React, { useState } from 'react';
import { useSessionStore } from '../session/sessionStore';
import { triggerHaptic } from '../../lib/utils/haptics';

export const GameDetailsScreen: React.FC = () => {
  const {
    selectedGameDetailsId,
    historySessions,
    activeSession,
    setScreen,
    startRematch,
    openAddPhotoModal,
    openPhotoViewer,
    settleTeaDuty,
    showToast
  } = useSessionStore();

  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  const sessionId = selectedGameDetailsId || activeSession?.id || historySessions[0]?.id;
  const session = historySessions.find(s => s.id === sessionId) || activeSession;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] gap-4">
        <h2 className="font-headline font-bold text-lg text-[#dfe2ee]">Session Not Found</h2>
        <button
          onClick={() => setScreen('ledger')}
          className="h-11 px-5 rounded-xl bg-[#4edea3] text-[#003824] font-headline font-bold text-xs uppercase"
        >
          Back to Ledger
        </button>
      </div>
    );
  }

  const results = session.results || [];
  const winner = results.find(r => r.isWinner) || results[0];
  const runnerUp = results.find(r => r.isRunnerUp) || (results.length > 1 ? results[1] : null);
  const teaLoser = results.find(r => r.isTeaDuty) || results[results.length - 1];
  const penaltyGap = (teaLoser && winner) ? teaLoser.totalScore - winner.totalScore : 0;
  const photos = session.photos || [];

  const handleShareWhatsApp = () => {
    triggerHaptic('medium');
    const text = `🃏 *${session.name}* (${session.gameConfig.name})\n🏆 Champion: ${winner?.playerName} (${winner?.totalScore} pts)\n🥈 Runner-Up: ${runnerUp?.playerName} (${runnerUp?.totalScore} pts)\n☕ Tea Duty: ${teaLoser?.playerName} (${teaLoser?.totalScore} pts)\n📸 Snaps: ${photos.length} captured.\n\nTracked on Rummy 7's!`;
    if (navigator.share) {
      navigator.share({ title: session.name, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      showToast("Scorecard copied for WhatsApp group!");
    }
  };

  const toggleRound = (roundNum: number) => {
    triggerHaptic('light');
    setExpandedRound(prev => prev === roundNum ? null : roundNum);
  };

  return (
    <div className="flex flex-col w-full pb-28 px-4 pt-1 max-w-md mx-auto select-none">
      {/* Top Details Subheader */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] font-headline text-[10px] font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
            {session.status === 'completed' ? 'FINALIZED' : 'ACTIVE'}
          </span>
          <span className="font-body text-xs text-[#86948a]">
            {new Date(session.startedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })} • {new Date(session.startedAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <button
          onClick={handleShareWhatsApp}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#262a33] text-[#4edea3] border border-[#3c4a42]/40 font-headline text-[10px] font-bold uppercase active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[14px]">chat</span>
          <span>WhatsApp</span>
        </button>
      </div>

      {/* Match Summary Box */}
      <div className="bg-[#1c2028] border border-[#3c4a42]/50 rounded-2xl p-4 shadow-xl mb-4 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[#ffb95f] text-xl">style</span>
          <div>
            <h2 className="font-headline font-bold text-lg text-[#dfe2ee] leading-tight">
              {session.name}
            </h2>
            <span className="font-body text-xs text-[#86948a]">
              {session.gameConfig.name} • {session.gameConfig.roundCount} Rounds
            </span>
          </div>
        </div>

        {/* 3 Podiums */}
        <div className="grid grid-cols-3 gap-2 bg-[#181c24] border border-[#3c4a42]/40 rounded-xl p-3 text-center mb-3">
          {winner && (
            <div className="flex flex-col">
              <span className="font-headline text-[9px] text-[#ffb95f] uppercase font-bold">
                WINNER 🏆
              </span>
              <span className="font-headline font-bold text-xs text-[#dfe2ee] truncate mt-0.5">
                {winner.playerName}
              </span>
              <span className="font-headline font-bold text-sm text-[#4edea3] mt-0.5">
                {winner.totalScore} pts
              </span>
            </div>
          )}

          {runnerUp && (
            <div className="flex flex-col border-x border-[#3c4a42]/40 px-1">
              <span className="font-headline text-[9px] text-[#bbcabf] uppercase font-bold">
                RUNNER-UP 🥈
              </span>
              <span className="font-headline font-bold text-xs text-[#dfe2ee] truncate mt-0.5">
                {runnerUp.playerName}
              </span>
              <span className="font-headline font-bold text-sm text-[#dfe2ee] mt-0.5">
                {runnerUp.totalScore} pts
              </span>
            </div>
          )}

          {teaLoser && (
            <div className="flex flex-col">
              <span className="font-headline text-[9px] text-[#ff7a73] uppercase font-bold">
                TEA DUTY ☕
              </span>
              <span className="font-headline font-bold text-xs text-[#ffb4ab] truncate mt-0.5">
                {teaLoser.playerName}
              </span>
              <span className="font-headline font-bold text-sm text-[#ff7a73] mt-0.5">
                {teaLoser.totalScore} pts
              </span>
            </div>
          )}
        </div>

        {/* Spread / Tea Deficit Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-headline font-bold">
            <span className="text-[#86948a] uppercase">Final Spread & Tea Deficit</span>
            <span className="text-[#ffb95f]">+{penaltyGap} pts penalty gap</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#0a0e16] flex overflow-hidden">
            <div className="h-full bg-[#4edea3] w-[40%]" />
            <div className="h-full bg-[#ffb95f] w-[25%]" />
            <div className="h-full bg-[#ff7a73] w-[35%]" />
          </div>
        </div>
      </div>

      {/* GAME SNAPS SECTION */}
      <section className="flex flex-col gap-2.5 mb-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4edea3] text-[20px]">photo_camera</span>
            <h3 className="font-headline font-bold text-sm uppercase text-[#dfe2ee]">
              Game Snaps ({photos.length})
            </h3>
          </div>

          <button
            onClick={() => openAddPhotoModal(session.id)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#4edea3] font-headline text-xs font-bold transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">add_a_photo</span>
            <span>Add Snap</span>
          </button>
        </div>

        {/* Horizontal Photo Strip */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
          {/* Card 1: New Snap Trigger */}
          <div
            onClick={() => openAddPhotoModal(session.id)}
            className="w-36 h-48 shrink-0 rounded-2xl bg-[#1c2028] border-2 border-dashed border-[#3c4a42] hover:border-[#4edea3]/50 flex flex-col items-center justify-center p-3 text-center cursor-pointer active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#4edea3]/20 text-[#4edea3] flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-2xl">add</span>
            </div>
            <span className="font-headline font-bold text-xs text-[#dfe2ee] uppercase">
              New Snap
            </span>
            <span className="font-body text-[10px] text-[#86948a] mt-1">
              Take photo or select
            </span>
          </div>

          {/* Snap Cards */}
          {photos.map(photo => (
            <div
              key={photo.id}
              onClick={() => openPhotoViewer(photo)}
              className="relative w-36 h-48 shrink-0 rounded-2xl overflow-hidden border border-[#3c4a42]/50 shadow-md group cursor-pointer active:scale-98 transition-all"
            >
              <img
                src={photo.thumbnailUrl || photo.storagePath}
                alt={photo.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-between p-2.5 pointer-events-none">
                {photo.tag && (
                  <span className="self-start px-2 py-0.5 rounded bg-black/60 text-[#4edea3] font-headline text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    {photo.tag}
                  </span>
                )}

                <div className="flex items-end justify-between">
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="font-headline font-bold text-xs text-[#dfe2ee] truncate">
                      {photo.caption}
                    </span>
                    {photo.subCaption && (
                      <span className="font-body text-[9px] text-[#bbcabf] truncate">
                        {photo.subCaption}
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-white text-[18px]">
                    open_in_full
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ROUND LEDGER TABLE */}
      <section className="bg-[#1c2028] border border-[#3c4a42]/40 rounded-2xl p-4 shadow-md flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#3c4a42]/30">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#ffb95f] text-[18px]">list_alt</span>
            <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-[#dfe2ee]">
              Round Ledger
            </h3>
          </div>
          <span className="font-headline text-[9px] text-[#86948a] uppercase font-bold">
            Tap Round to Expand
          </span>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="font-headline text-[10px] text-[#86948a] uppercase border-b border-[#3c4a42]/40">
                <th className="py-2 text-left pl-1">ROUND</th>
                {session.players.map(p => (
                  <th key={p.id} className="py-2 px-1 text-[#dfe2ee] font-bold">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-headline text-xs divide-y divide-[#3c4a42]/20">
              {session.rounds.map(rnd => {
                const is2x = rnd.multiplier > 1;
                const isExpanded = expandedRound === rnd.roundNumber;

                return (
                  <React.Fragment key={rnd.roundNumber}>
                    <tr
                      onClick={() => toggleRound(rnd.roundNumber)}
                      className="hover:bg-[#262a33]/60 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 text-left pl-1 font-bold text-[#bbcabf]">
                        <span className="inline-flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px] text-[#86948a]">
                            {isExpanded ? 'expand_more' : 'chevron_right'}
                          </span>
                          R{rnd.roundNumber}
                          {is2x && (
                            <span className="text-[9px] text-[#ffb95f] font-bold ml-1">2x</span>
                          )}
                        </span>
                      </td>

                      {session.players.map(p => {
                        const sc = rnd.scores[p.id];
                        const isZero = sc && sc.entered && sc.finalScore === 0;
                        const isHigh = sc && sc.entered && sc.finalScore >= 40;

                        return (
                          <td
                            key={p.id}
                            className={`py-2.5 px-1 font-bold tabular-nums ${
                              isZero
                                ? 'text-[#4edea3]'
                                : isHigh
                                ? 'text-[#ff7a73]'
                                : 'text-[#dfe2ee]'
                            }`}
                          >
                            {sc && sc.entered ? (isZero ? '0' : sc.finalScore) : '-'}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Expanded details */}
                    {isExpanded && (
                      <tr className="bg-[#181c24] text-[10px] font-body text-[#bbcabf]">
                        <td colSpan={session.players.length + 1} className="p-2 text-left">
                          <div className="flex flex-wrap items-center justify-between gap-2 px-2">
                            <span>Round Multiplier: <strong>{rnd.multiplier}x</strong></span>
                            <span>Status: {rnd.isCompleted ? 'Finished' : 'In Progress'}</span>
                            {rnd.isCompleted && (
                              <span className="text-[#4edea3] font-headline font-bold">
                                Low hand won with 0 pts!
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* TOTAL ROW */}
              <tr className="font-headline text-xs font-bold border-t-2 border-[#4edea3]/40 bg-[#181c24]/90">
                <td className="py-3 text-left pl-1 text-[#86948a] uppercase tracking-wider">
                  TOTAL
                </td>
                {session.players.map((p, idx) => {
                  const res = results.find(r => r.playerId === p.id);
                  const isWin = res?.isWinner;
                  const isTea = res?.isTeaDuty;

                  return (
                    <td
                      key={p.id}
                      className={`py-3 px-1 tabular-nums font-bold text-sm ${
                        isWin
                          ? 'text-[#4edea3]'
                          : isTea
                          ? 'text-[#ff7a73]'
                          : idx === 1
                          ? 'text-[#ffb95f]'
                          : 'text-[#dfe2ee]'
                      }`}
                    >
                      {res?.totalScore || 0}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Cutting Chai Sponsor Card */}
      {teaLoser && (
        <div className="bg-[#1c2028] border border-[#ff7a73]/30 rounded-2xl p-4 shadow-sm flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#ff7a73]/20 flex items-center justify-center text-[#ff7a73] shrink-0">
              <span className="material-symbols-outlined text-xl">local_cafe</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline font-bold text-xs text-[#dfe2ee]">
                Cutting Chai Sponsor
              </span>
              <span className="font-body text-xs text-[#bbcabf] truncate">
                {teaLoser.playerName} owes 5 cups & samosas
              </span>
            </div>
          </div>

          <button
            onClick={() => settleTeaDuty(session.id)}
            className={`px-3 py-1.5 rounded-full font-headline text-[10px] font-bold uppercase transition-all shrink-0 ${
              session.teaSettled
                ? 'bg-[#10b981] text-[#003824]'
                : 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ff7a73]/30'
            }`}
          >
            {session.teaSettled ? 'SETTLED' : 'PENDING'}
          </button>
        </div>
      )}

      {/* Bottom CTAs */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={() => {
            triggerHaptic('success');
            startRematch();
          }}
          className="w-full h-13 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-headline font-bold text-sm uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_20px_rgba(78,222,163,0.3)] cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">replay</span>
          <span>Rematch With Same Players</span>
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="w-full h-12 rounded-xl bg-[#262a33] hover:bg-[#353942] border border-[#3c4a42]/50 text-[#dfe2ee] font-headline font-bold text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#4edea3] text-lg">share</span>
          <span>Export Match Card & Snaps</span>
        </button>
      </div>
    </div>
  );
};
