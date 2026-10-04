import React, { useState } from 'react';
import { useSessionStore } from '../session/sessionStore';
import { CrownCelebration3D } from '../../components/animations/CrownCelebration3D';
import { SteamingTeaCup3D } from '../../components/animations/SteamingTeaCup3D';
import { ConfettiRain } from '../../components/animations/ConfettiRain';
import { triggerHaptic } from '../../lib/utils/haptics';

export const MatchResultsScreen: React.FC = () => {
  const {
    activeSession,
    historySessions,
    viewingHistoricalSessionId,
    startRematch,
    settleTeaDuty,
    setScreen,
    showToast,
    openAddPhotoModal,
    openPhotoViewer
  } = useSessionStore();

  const [activeTab, setActiveTab] = useState<'podium' | 'tea'>('podium');
  const [excuseChecked, setExcuseChecked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  // If viewing historical session, retrieve it; else use activeSession
  const targetSession = viewingHistoricalSessionId
    ? historySessions.find(s => s.id === viewingHistoricalSessionId) || activeSession
    : activeSession;

  if (!targetSession || !targetSession.results || targetSession.results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined text-[#ffb95f] text-5xl">military_tech</span>
        <h2 className="font-headline font-bold text-xl text-[#dfe2ee]">No Completed Match Data</h2>
        <button
          onClick={() => setScreen('dashboard')}
          className="h-12 px-6 rounded-xl bg-[#4edea3] text-[#003824] font-headline font-bold text-sm"
        >
          Return to Table
        </button>
      </div>
    );
  }

  const results = targetSession.results;
  const winner = results.find(r => r.isWinner) || results[0];
  const runnerUp = results.find(r => r.isRunnerUp) || (results.length > 1 ? results[1] : null);
  const teaDutyPlayers = results.filter(r => r.isTeaDuty);
  const mainTeaLoser = teaDutyPlayers[0] || results[results.length - 1];

  const handleShareToWhatsApp = () => {
    triggerHaptic('medium');
    const winnerText = `👑 *${targetSession.name}* Final Scorecard:\n🏆 1st: ${winner.playerName} (${winner.totalScore} pts)`;
    const runnerText = runnerUp ? `\n🥈 2nd: ${runnerUp.playerName} (${runnerUp.totalScore} pts)` : '';
    const teaText = `\n☕ Tea Duty: ${teaDutyPlayers.map(p => p.playerName).join(' & ')} (${mainTeaLoser.totalScore} pts) owes chais & samosas!`;
    const fullText = `${winnerText}${runnerText}${teaText}\n\nRecorded on Rummy 7's Table Felt.`;

    if (navigator.share) {
      navigator.share({
        title: `${targetSession.name} Verdict`,
        text: fullText
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(fullText);
      showToast("Scorecard copied for WhatsApp group!");
    }
  };

  const handleReplayFx = () => {
    triggerHaptic('success');
    setShowConfetti(false);
    setTimeout(() => setShowConfetti(true), 50);
    showToast("Replaying celebration effects!");
  };

  return (
    <div className="flex flex-col w-full pb-24 px-4 pt-1 max-w-md mx-auto select-none">
      {showConfetti && <ConfettiRain />}

      {/* Match Status Banner */}
      <section className="flex flex-col gap-2 mb-3">
        <div className="flex items-center justify-between bg-[#1c2028] border border-[#3c4a42]/40 px-3 py-2 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
            <span className="font-headline text-[10px] text-[#bbcabf] uppercase font-bold tracking-wider truncate">
              {targetSession.name} • {targetSession.gameConfig.roundCount} ROUNDS
            </span>
          </div>
          <span className="font-headline text-[10px] px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] uppercase font-bold shrink-0">
            LOW SCORE WINS
          </span>
        </div>

        {/* View Switcher: Winner Podium vs Tea Duty Spotlight */}
        <div className="bg-[#181c24] border border-[#3c4a42]/40 rounded-xl p-1 flex gap-1 shadow-sm">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('podium');
            }}
            className={`flex-1 py-1.5 rounded-lg font-headline text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'podium'
                ? 'bg-[#262a33] text-[#4edea3] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dfe2ee]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">military_tech</span>
            <span>Winner Podium</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('tea');
            }}
            className={`flex-1 py-1.5 rounded-lg font-headline text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'tea'
                ? 'bg-[#262a33] text-[#ff7a73] shadow-sm'
                : 'text-[#bbcabf] hover:text-[#dfe2ee]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">local_cafe</span>
            <span>Tea Duty Spotlight</span>
          </button>
        </div>
      </section>

      {/* TAB 1: WINNER PODIUM */}
      {activeTab === 'podium' && (
        <>
          {/* Winner Celebration Showcase */}
          <section className="relative flex flex-col items-center bg-gradient-to-b from-[#262a33]/90 via-[#1c2028]/80 to-[#181c24] border border-[#3c4a42]/50 rounded-2xl p-4 shadow-xl overflow-hidden mb-4">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#ffb95f]/15 rounded-full blur-3xl pointer-events-none" />

            {/* 3D Rotating Crown Interactive Canvas */}
            <div className="relative w-full h-56 flex items-center justify-center -mt-2">
              <CrownCelebration3D className="w-full h-56" />
            </div>

            {/* Champion Details Card */}
            <div className="w-full flex flex-col items-center text-center relative z-10 -mt-4">
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ee9800] via-[#ffb95f] to-[#6ffbbe] flex items-center justify-center p-1 shadow-lg shadow-[#ffb95f]/20">
                  <div className="w-full h-full rounded-full bg-[#0a0e16] flex items-center justify-center">
                    <span className="font-headline font-bold text-2xl text-[#ffb95f]">
                      {winner.playerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#ffb95f] text-[#2a1700] w-6 h-6 rounded-full flex items-center justify-center shadow-md text-xs font-bold">
                  👑
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffb95f]/15 text-[#ffb95f] mb-1">
                <span className="font-headline text-[11px] font-bold tracking-wider">
                  CHAMPION OF THE NIGHT 👑
                </span>
              </div>

              <h2 className="font-headline font-bold text-2xl text-[#dfe2ee] mb-0.5">
                {winner.playerName}
              </h2>

              <div className="font-headline font-bold text-4xl text-[#4edea3] tracking-tight mb-2 tabular-nums">
                {winner.totalScore}{' '}
                <span className="font-headline text-sm text-[#bbcabf] font-normal uppercase">
                  PTS
                </span>
              </div>

              <p className="font-body text-xs text-[#bbcabf] max-w-xs mb-3 italic">
                "Bow down! {winner.playerName} rules the table tonight with clinical coldness."
              </p>

              {/* Win Stat Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                <div className="flex items-center gap-1 bg-[#31353e]/80 border border-[#3c4a42]/40 px-2.5 py-1 rounded-full text-[#4edea3]">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                  <span className="font-headline text-[10px] text-[#dfe2ee]">
                    {winner.bustsCount} Busts
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-[#31353e]/80 border border-[#3c4a42]/40 px-2.5 py-1 rounded-full text-[#ffb95f]">
                  <span className="material-symbols-outlined text-[14px]">casino</span>
                  <span className="font-headline text-[10px] text-[#dfe2ee]">
                    {winner.dickHandsCount} Dick Hands (0 pts)
                  </span>
                </div>
                {runnerUp && (
                  <div className="flex items-center gap-1 bg-[#31353e]/80 border border-[#3c4a42]/40 px-2.5 py-1 rounded-full text-[#6ffbbe]">
                    <span className="material-symbols-outlined text-[14px]">trending_down</span>
                    <span className="font-headline text-[10px] text-[#dfe2ee]">
                      Net -{runnerUp.totalScore - winner.totalScore} to 2nd
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Runner-Up Card */}
          {runnerUp && (
            <section className="flex flex-col bg-[#1c2028] border border-[#3c4a42]/40 rounded-2xl p-4 mb-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#31353e] flex items-center justify-center text-lg shrink-0 shadow-inner">
                    🥈
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline text-[10px] text-[#bbcabf] uppercase tracking-wider font-bold">
                      RUNNER-UP
                    </span>
                    <span className="font-headline font-bold text-base text-[#dfe2ee] truncate">
                      {runnerUp.playerName}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-headline font-bold text-xl text-[#dfe2ee] tabular-nums">
                    {runnerUp.totalScore}{' '}
                    <span className="font-headline text-xs text-[#86948a]">PTS</span>
                  </div>
                  <span className="font-headline text-[10px] text-[#86948a]">
                    +{runnerUp.totalScore - winner.totalScore} gap
                  </span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#3c4a42]/30 flex items-center gap-1.5 text-xs text-[#bbcabf]">
                <span className="material-symbols-outlined text-[#4edea3] text-[16px]">check_circle</span>
                <span>Solid defense throughout, held 2nd spot calmly.</span>
              </div>
            </section>
          )}

          {/* TEA DUTY LOSER CARD */}
          <section className="relative flex flex-col bg-gradient-to-b from-[#93000a]/30 via-[#262a33]/90 to-[#1c2028] border border-[#ff7a73]/40 rounded-2xl p-4 mb-4 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 bg-[#93000a]/60 px-3 py-1 rounded-full text-[#ffdad7] shadow-sm">
                <span className="material-symbols-outlined text-sm">local_cafe</span>
                <span className="font-headline text-xs font-bold uppercase tracking-wider">
                  TEA DUTY ACTIVATED
                </span>
              </div>
              <span className="font-headline text-[10px] text-[#ffb4ab] uppercase font-bold tracking-widest bg-[#93000a]/30 px-2 py-0.5 rounded">
                LAST PLACE
              </span>
            </div>

            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-[#93000a] flex items-center justify-center text-[#ffdad6] shadow-lg font-headline font-bold text-2xl">
                    {mainTeaLoser.playerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#0a0e16] text-[#ffb95f] p-0.5 rounded-full shadow text-sm">
                    ☕
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <h3 className="font-headline font-bold text-lg text-[#dfe2ee] truncate">
                    {mainTeaLoser.playerName}
                  </h3>
                  <div className="inline-flex items-center gap-1 text-[#ffb95f]">
                    <span className="material-symbols-outlined text-xs">emoji_food_beverage</span>
                    <span className="font-headline text-[10px] font-bold tracking-wide uppercase">
                      OFFICIAL CHAI SPONSOR 🫖
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-headline font-bold text-3xl text-[#ff7a73] tabular-nums">
                  {mainTeaLoser.totalScore}
                </div>
                <span className="font-headline text-[9px] text-[#ffb4ab] bg-[#93000a]/40 px-1.5 py-0.5 rounded font-bold uppercase">
                  BUSTED
                </span>
              </div>
            </div>

            {/* Verdict container */}
            <div className="bg-[#0a0e16]/80 rounded-xl p-3 flex flex-col gap-1 mb-3 border border-[#3c4a42]/30">
              <div className="flex items-center gap-1.5 text-[#ffb95f]">
                <span className="material-symbols-outlined text-[17px]">payments</span>
                <span className="font-headline text-xs font-bold">Your wallet has entered the chat 💸</span>
              </div>
              <p className="font-body text-xs text-[#bbcabf]">
                <strong className="text-[#dfe2ee]">Table verdict:</strong> 5 Cutting Chais + 5 Hot Samosas on {mainTeaLoser.playerName} at Raju Tapri!
              </p>
              <div className="flex items-center gap-1 text-[#86948a] text-[11px] italic mt-0.5">
                <span className="material-symbols-outlined text-[13px]">history_edu</span>
                <span>"No escape. The felt remembers."</span>
              </div>
            </div>

            {/* Chai Settlement Action Button */}
            <button
              onClick={settleTeaDuty}
              className={`w-full min-h-[48px] rounded-xl font-headline font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.97] cursor-pointer ${
                targetSession.teaSettled
                  ? 'bg-[#10b981] text-[#003824]'
                  : 'bg-[#ee9800] text-[#472a00] hover:bg-[#ffb95f]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {targetSession.teaSettled ? 'verified' : 'task_alt'}
              </span>
              <span>
                {targetSession.teaSettled
                  ? `Tea Duty Settled! Paid ☕`
                  : `Settle Tea Duty ☕ (Paid / Promised)`}
              </span>
            </button>
          </section>

          {/* Full Table Summary Strip */}
          <section className="flex flex-col bg-[#1c2028] border border-[#3c4a42]/40 rounded-2xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3c4a42]/30">
              <span className="font-headline text-xs font-bold text-[#bbcabf] uppercase tracking-wider">
                Complete Match Table
              </span>
              <span className="font-headline text-[10px] text-[#86948a]">
                {results.length} Players
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {results.map((r, idx) => {
                const isWin = r.isWinner;
                const isTea = r.isTeaDuty;

                return (
                  <div
                    key={r.playerId}
                    className={`flex items-center justify-between py-2 px-3 rounded-xl border ${
                      isWin
                        ? 'bg-[#262a33] border-[#4edea3]/30'
                        : isTea
                        ? 'bg-[#93000a]/20 border-[#ff7a73]/30'
                        : 'bg-[#181c24] border-[#3c4a42]/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`font-headline font-bold text-xs w-4 ${
                        isWin ? 'text-[#ffb95f]' : isTea ? 'text-[#ff7a73]' : 'text-[#86948a]'
                      }`}>
                        #{r.finalPosition}
                      </span>
                      <span className="font-headline font-bold text-xs text-[#dfe2ee] truncate">
                        {r.playerName}
                      </span>
                      {isWin && (
                        <span className="font-headline text-[9px] px-1.5 py-0.2 rounded bg-[#ffb95f]/20 text-[#ffb95f] font-bold">
                          WINNER
                        </span>
                      )}
                      {isTea && (
                        <span className="font-headline text-[9px] px-1.5 py-0.2 rounded bg-[#93000a] text-[#ffdad6] font-bold">
                          TEA DUTY
                        </span>
                      )}
                    </div>

                    <span className={`font-headline font-bold text-sm tabular-nums ${
                      isWin ? 'text-[#4edea3]' : isTea ? 'text-[#ff7a73]' : 'text-[#dfe2ee]'
                    }`}>
                      {r.totalScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Interactive Utility Toggle */}
          <div className="flex items-center justify-between bg-[#1c2028] border border-[#3c4a42]/40 px-4 py-3 rounded-2xl mb-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb95f] text-xl">animation</span>
              <span className="font-body text-xs text-[#dfe2ee] font-medium">
                Replay Celebration Effects
              </span>
            </div>
            <button
              onClick={handleReplayFx}
              className="px-3 py-1 rounded-full bg-[#262a33] hover:bg-[#353942] text-[#dfe2ee] hover:text-[#ffb95f] active:scale-95 font-headline text-xs font-bold transition-all border border-[#3c4a42]/50"
            >
              Trigger 🫖
            </button>
          </div>

          {/* Game Snaps on Match Results */}
          <div className="bg-[#1c2028] border border-[#3c4a42]/40 rounded-2xl p-4 mb-4 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3] text-xl">photo_camera</span>
                <span className="font-headline font-bold text-xs uppercase tracking-wider text-[#dfe2ee]">
                  Match Moments ({targetSession.photos?.length || 0})
                </span>
              </div>
              <button
                onClick={() => openAddPhotoModal(targetSession.id)}
                className="px-2.5 py-1 rounded-full bg-[#4edea3]/20 hover:bg-[#4edea3]/30 text-[#4edea3] font-headline text-[10px] font-bold uppercase transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[13px]">add_a_photo</span>
                <span>Add Snap</span>
              </button>
            </div>

            {targetSession.photos && targetSession.photos.length > 0 ? (
              <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {targetSession.photos.map(p => (
                  <div
                    key={p.id}
                    onClick={() => openPhotoViewer(p)}
                    className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0 border border-[#3c4a42]/50 shadow cursor-pointer active:scale-95 transition-transform"
                  >
                    <img src={p.thumbnailUrl || p.storagePath} alt={p.caption} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="font-headline font-bold text-[10px] text-white truncate">
                        {p.caption}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body text-xs text-[#86948a] italic">
                No moments snapped yet. Capture the victory pose or the tea round!
              </p>
            )}
          </div>
        </>
      )}

      {/* TAB 2: TEA DUTY SPOTLIGHT */}
      {activeTab === 'tea' && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1c2028] border border-[#ff7a73]/40 rounded-2xl p-4 shadow-xl overflow-hidden relative">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffb95f] text-[#2a1700] font-headline text-xs font-bold mb-2">
                <span className="material-symbols-outlined text-[16px]">timer_off</span>
                <span>FINAL PENALTY RULING</span>
              </div>

              <h2 className="font-headline font-bold text-xl text-[#dfe2ee] tracking-tight">
                TEA DUTY ENGAGED ☕
              </h2>
              <p className="font-body text-xs text-[#bbcabf] max-w-xs mt-1">
                Highest score penalty reached ({mainTeaLoser.totalScore} pts). Group refreshments are officially sponsored.
              </p>

              {/* 3D Steaming Cup Animation */}
              <div className="w-full relative flex items-center justify-center my-2">
                <SteamingTeaCup3D className="w-full h-56" />

                <div className="absolute bottom-2 bg-[#0f131c]/90 backdrop-blur-sm border border-[#ffb95f]/30 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 text-[#ffb95f]">
                  <span className="material-symbols-outlined text-[16px] animate-pulse">local_fire_department</span>
                  <span className="font-headline text-[11px] font-bold">Hot Cutting Chai On Deck</span>
                </div>
              </div>

              {/* Designated Sponsor Profile Card */}
              <div className="w-full bg-[#181c24] border border-[#3c4a42]/40 rounded-2xl p-4 text-left shadow-sm mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#93000a] text-[#ffdad6] font-headline font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
                      {mainTeaLoser.playerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-headline font-bold text-base text-[#dfe2ee] truncate">
                          {mainTeaLoser.playerName}
                        </span>
                        <span className="material-symbols-outlined text-[#ffb95f] text-[18px]">
                          emoji_food_beverage
                        </span>
                      </div>
                      <span className="bg-[#ee9800] text-[#472a00] font-headline text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Group Tea Sponsor
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-headline font-bold text-3xl text-[#ff7a73] tabular-nums block">
                      {mainTeaLoser.totalScore}
                    </span>
                    <span className="font-headline text-[9px] text-[#86948a] uppercase font-bold block">
                      Total Points
                    </span>
                  </div>
                </div>

                {/* Over Safety Limit Pill */}
                <div className="mt-3 bg-[#93000a] text-[#ffdad6] rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                    <span className="font-headline text-xs font-bold">Over Safety Limit</span>
                  </div>
                  <span className="font-headline font-bold text-sm">
                    +{mainTeaLoser.totalScore - winner.totalScore} pts margin
                  </span>
                </div>

                {/* Order Bill Estimate Tab */}
                <div className="mt-3 bg-[#1c2028] border border-[#3c4a42]/30 rounded-xl p-3">
                  <div className="flex justify-between items-center text-[#86948a] font-headline text-[10px] uppercase font-bold mb-1">
                    <span>Room Order Tab</span>
                    <span>Est. ₹190</span>
                  </div>
                  <div className="flex justify-between items-center text-[#dfe2ee] font-body text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">coffee</span>
                      5 × Masala Cutting Chais
                    </span>
                    <span className="font-headline font-bold text-xs">₹100</span>
                  </div>
                  <div className="flex justify-between items-center text-[#dfe2ee] font-body text-xs mt-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">bakery_dining</span>
                      1 × Osmania Biscuit Plate & Samosas
                    </span>
                    <span className="font-headline font-bold text-xs">₹90</span>
                  </div>
                </div>

                {/* Humorous Penalty Checklist */}
                <div className="mt-3 space-y-2">
                  <div className="font-headline text-[10px] uppercase font-bold tracking-wider text-[#86948a]">
                    Penalty Protocol Status
                  </div>

                  <label className="flex items-center gap-2.5 bg-[#0a0e16] p-2.5 rounded-xl border border-[#3c4a42]/30">
                    <input type="checkbox" checked disabled className="accent-[#4edea3] w-4 h-4 rounded" />
                    <span className="font-body text-xs text-[#bbcabf] line-through">
                      Corner tea stall guy pinged
                    </span>
                    <span className="material-symbols-outlined text-[#4edea3] text-[16px] ml-auto">check_circle</span>
                  </label>

                  <label className="flex items-center gap-2.5 bg-[#0a0e16] p-2.5 rounded-xl border border-[#3c4a42]/30">
                    <input type="checkbox" checked disabled className="accent-[#4edea3] w-4 h-4 rounded" />
                    <span className="font-body text-xs text-[#bbcabf] line-through">
                      Warm bun maska added by Kumar
                    </span>
                    <span className="material-symbols-outlined text-[#4edea3] text-[16px] ml-auto">check_circle</span>
                  </label>

                  <label
                    onClick={() => {
                      triggerHaptic('medium');
                      setExcuseChecked(!excuseChecked);
                    }}
                    className="flex items-center gap-2.5 bg-[#0a0e16] p-2.5 rounded-xl border border-[#ffb95f]/30 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={excuseChecked}
                      onChange={() => {}}
                      className="accent-[#4edea3] w-4 h-4 rounded"
                    />
                    <span className="font-body text-xs text-[#dfe2ee]">
                      Card luck excuses universally rejected
                    </span>
                    <span className="material-symbols-outlined text-[#ffb95f] text-[16px] ml-auto">gavel</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Dock */}
      <footer className="sticky bottom-0 inset-x-0 w-full pt-2 pb-safe bg-[#0f131c]/95 backdrop-blur-md flex flex-col gap-2 z-30">
        <button
          onClick={() => {
            triggerHaptic('success');
            startRematch();
          }}
          className="w-full min-h-[52px] bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-headline font-bold text-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.35)] active:scale-[0.96] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] font-bold">restart_alt</span>
          <span>Rematch / New Game</span>
        </button>

        <button
          onClick={handleShareToWhatsApp}
          className="w-full min-h-[46px] bg-[#262a33] hover:bg-[#353942] border border-[#3c4a42]/50 text-[#dfe2ee] font-headline font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 active:scale-[0.96] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#4edea3] text-[18px]">share</span>
          <span>Export & Share to WhatsApp Group</span>
        </button>
      </footer>
    </div>
  );
};
