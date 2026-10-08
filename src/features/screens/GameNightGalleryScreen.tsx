import React, { useState } from 'react';
import { useSessionStore } from '../session/sessionStore';
import { triggerHaptic } from '../../lib/utils/haptics';

export const GameNightGalleryScreen: React.FC = () => {
  const {
    historySessions,
    activeSession,
    openAddPhotoModal,
    openPhotoViewer,
    togglePhotoLike,
    viewGameDetails
  } = useSessionStore();

  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Gather all photos across all sessions
  const allSessions = activeSession ? [activeSession, ...historySessions.filter(s => s.id !== activeSession.id)] : historySessions;
  const allPhotos = allSessions.flatMap(s => s.photos || []);

  const totalSnapsCount = allPhotos.length;
  const totalTeasCount = historySessions.reduce((acc, s) => {
    return acc + (s.results?.filter(r => r.isTeaDuty).length || 1);
  }, 12);

  // Group photos by session
  const filteredSessions = allSessions.filter(session => {
    const photos = session.photos || [];
    if (photos.length === 0) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === '7s') return session.gameConfig.variant === '7s';
    if (activeFilter === '5s') return session.gameConfig.variant === '5s';
    if (activeFilter === 'ace') return session.gameConfig.variant === 'ace';
    return true;
  });

  const count7s = allPhotos.filter(p => p.gameName.includes('7s')).length || 10;
  const count5s = allPhotos.filter(p => p.gameName.includes('5s')).length || 4;
  const countAce = allPhotos.filter(p => p.gameName.includes('ACE')).length || 4;

  return (
    <div className="flex flex-col w-full pb-28 px-4 pt-1 max-w-md mx-auto select-none">
      {/* Gallery Header Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col">
          <h2 className="font-headline font-bold text-2xl text-[#dfe2ee] tracking-tight">
            GAME NIGHT GALLERY
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            <span className="font-body text-xs text-[#bbcabf]">
              Your Game Night Memories • {totalSnapsCount} Moments Captured
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-10 h-10 rounded-full bg-[#262a33] text-[#bbcabf] hover:text-[#4edea3] flex items-center justify-center border border-[#3c4a42]/40 active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">photo_library</span>
        </button>
      </div>

      {/* Live Vault Banner */}
      <div className="rounded-2xl bg-[#1c2028] border border-[#3c4a42]/50 p-3 shadow-md flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#ee9800]/20 text-[#ffb95f] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-xl">photo_album</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-headline text-[10px] text-[#ffb95f] uppercase font-bold tracking-wider">
            LIVE VAULT
          </span>
          <span className="font-headline font-bold text-xs text-[#dfe2ee] truncate">
            {allSessions.length} Sessions • {totalTeasCount} Teas Sponsored • {totalSnapsCount} Snaps
          </span>
        </div>
      </div>

      {/* Dominant "+ Add Game Snap" CTA */}
      <button
        onClick={() => openAddPhotoModal()}
        className="w-full h-14 rounded-2xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-headline font-bold text-base uppercase flex items-center justify-center gap-2 active:scale-97 transition-all shadow-[0_4px_24px_rgba(78,222,163,0.35)] cursor-pointer mb-3"
      >
        <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
        <span>+ Add Game Snap</span>
      </button>

      {/* Horizontal Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveFilter('all');
          }}
          className={`px-3 py-1.5 rounded-full font-headline text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
            activeFilter === 'all'
              ? 'bg-[#4edea3] text-[#003824]'
              : 'bg-[#1c2028] text-[#bbcabf] border border-[#3c4a42]/40 hover:text-[#dfe2ee]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>All ({totalSnapsCount})</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveFilter('7s');
          }}
          className={`px-3 py-1.5 rounded-full font-headline text-xs font-bold whitespace-nowrap transition-all ${
            activeFilter === '7s'
              ? 'bg-[#4edea3] text-[#003824]'
              : 'bg-[#1c2028] text-[#bbcabf] border border-[#3c4a42]/40 hover:text-[#dfe2ee]'
          }`}
        >
          7s Rummy ({count7s})
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveFilter('5s');
          }}
          className={`px-3 py-1.5 rounded-full font-headline text-xs font-bold whitespace-nowrap transition-all ${
            activeFilter === '5s'
              ? 'bg-[#4edea3] text-[#003824]'
              : 'bg-[#1c2028] text-[#bbcabf] border border-[#3c4a42]/40 hover:text-[#dfe2ee]'
          }`}
        >
          5s Rummy ({count5s})
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveFilter('ace');
          }}
          className={`px-3 py-1.5 rounded-full font-headline text-xs font-bold whitespace-nowrap transition-all ${
            activeFilter === 'ace'
              ? 'bg-[#4edea3] text-[#003824]'
              : 'bg-[#1c2028] text-[#bbcabf] border border-[#3c4a42]/40 hover:text-[#dfe2ee]'
          }`}
        >
          ACE ({countAce})
        </button>
      </div>

      {/* Grouped Session Gallery Sections */}
      <div className="flex flex-col gap-6">
        {filteredSessions.map(session => {
          const photos = session.photos || [];
          const dateStr = new Date(session.startedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          const featuredPhoto = photos[0];
          const remainingPhotos = photos.slice(1);

          return (
            <div key={session.id} className="flex flex-col gap-3">
              {/* Group Header */}
              <div className="flex items-center justify-between px-1">
                <div
                  onClick={() => viewGameDetails(session.id)}
                  className="flex flex-col cursor-pointer group"
                >
                  <h3 className="font-headline font-bold text-base text-[#dfe2ee] group-hover:text-[#4edea3] transition-colors">
                    {session.name}
                  </h3>
                  <span className="font-body text-xs text-[#86948a]">
                    {dateStr} • {session.tableNote || 'Table #03'}
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#10b981]/15 text-[#4edea3] font-headline text-[10px] font-bold uppercase border border-[#4edea3]/30">
                  {session.gameConfig.name} • {session.gameConfig.roundCount} Rounds
                </span>
              </div>

              {/* Large Featured Photo Card */}
              {featuredPhoto && (
                <div
                  onClick={() => openPhotoViewer(featuredPhoto)}
                  className="relative rounded-3xl overflow-hidden border border-[#3c4a42]/50 shadow-xl bg-black group cursor-pointer active:scale-99 transition-all"
                >
                  <img
                    src={featuredPhoto.storagePath}
                    alt={featuredPhoto.caption}
                    className="w-full h-64 object-cover group-hover:scale-103 transition-transform duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/40 flex flex-col justify-between p-4 pointer-events-none">
                    <div className="flex items-center justify-between w-full">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#4edea3] font-headline text-[10px] font-bold uppercase tracking-wider border border-[#4edea3]/30">
                        {featuredPhoto.tag || 'ROUND 5 CARD FLIP'}
                      </span>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          togglePhotoLike(featuredPhoto.id);
                        }}
                        className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-[#ff7a73] flex items-center justify-center pointer-events-auto active:scale-90 transition-transform border border-white/20"
                      >
                        <span className="material-symbols-outlined text-[18px]">favorite</span>
                      </button>
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="flex flex-col min-w-0 pr-2">
                        <h4 className="font-headline font-bold text-lg text-[#dfe2ee] leading-tight">
                          {featuredPhoto.caption}
                        </h4>
                        {featuredPhoto.subCaption && (
                          <p className="font-body text-xs text-[#bbcabf] mt-0.5">
                            {featuredPhoto.subCaption}
                          </p>
                        )}

                        {/* Player Tag avatars */}
                        {featuredPhoto.playerInitials && featuredPhoto.playerInitials.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {featuredPhoto.playerInitials.map((init, i) => (
                                <div
                                  key={i}
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0f131c] bg-[#262a33] text-[#4edea3] font-headline text-[10px] font-bold flex items-center justify-center border border-[#4edea3]/30"
                                >
                                  {init}
                                </div>
                              ))}
                            </div>
                            <span className="font-body text-[11px] text-[#bbcabf]">
                              Tagged: {featuredPhoto.playerInitials.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Side-by-Side Snaps Grid */}
              {remainingPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {remainingPhotos.slice(0, 2).map(photo => (
                    <div
                      key={photo.id}
                      onClick={() => openPhotoViewer(photo)}
                      className="rounded-2xl overflow-hidden border border-[#3c4a42]/40 bg-[#1c2028] shadow-md group cursor-pointer active:scale-98 transition-all flex flex-col"
                    >
                      <div className="relative h-32 w-full overflow-hidden bg-black">
                        <img
                          src={photo.thumbnailUrl || photo.storagePath}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {photo.tag && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[#ffb95f] font-headline text-[9px] font-bold uppercase">
                            {photo.tag}
                          </span>
                        )}
                      </div>

                      <div className="p-3 flex flex-col justify-between flex-1">
                        <div>
                          <h5 className="font-headline font-bold text-xs text-[#dfe2ee] truncate">
                            {photo.caption}
                          </h5>
                          {photo.subCaption && (
                            <p className="font-body text-[10px] text-[#bbcabf] truncate mt-0.5">
                              {photo.subCaption}
                            </p>
                          )}
                        </div>

                        {photo.badge && (
                          <div className="flex items-center gap-1 mt-2 pt-1 border-t border-[#3c4a42]/30 text-[10px] font-headline font-bold text-[#4edea3]">
                            <span className="material-symbols-outlined text-[13px]">military_tech</span>
                            <span>{photo.badge}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* "Playing right now?" Bottom Callout Card */}
      <div className="mt-6 rounded-3xl bg-[#1c2028] border border-[#3c4a42]/50 p-4 shadow-xl flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#31353e] text-[#4edea3] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">videocam</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="font-headline font-bold text-sm text-[#dfe2ee]">
              Playing right now?
            </h4>
            <p className="font-body text-xs text-[#bbcabf] mt-0.5">
              Snap the current table cards or the tea tray! Keep the ledger honest.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => openAddPhotoModal()}
            className="h-11 px-4 rounded-xl bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-headline font-bold text-xs uppercase flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">photo_camera</span>
            <span>+ Snap Table</span>
          </button>
          <span className="font-headline text-[10px] uppercase font-bold text-[#86948a] tracking-wider">
            Instant Tagging
          </span>
        </div>
      </div>
    </div>
  );
};
