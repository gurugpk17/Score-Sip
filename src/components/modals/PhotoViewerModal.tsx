import React from 'react';
import { useSessionStore } from '../../features/session/sessionStore';
import { triggerHaptic } from '../../lib/utils/haptics';

export const PhotoViewerModal: React.FC = () => {
  const {
    activePhotoModal,
    closePhotoViewer,
    togglePhotoLike,
    openDeletePhotoModal,
    historySessions,
    openPhotoViewer
  } = useSessionStore();

  if (!activePhotoModal) return null;

  // Find all photos in this session or all sessions for next/prev navigation
  const allPhotos = historySessions.flatMap(s => s.photos || []);
  const currentIndex = allPhotos.findIndex(p => p.id === activePhotoModal.id);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      triggerHaptic('selection');
      openPhotoViewer(allPhotos[currentIndex - 1]);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < allPhotos.length - 1) {
      triggerHaptic('selection');
      openPhotoViewer(allPhotos[currentIndex + 1]);
    }
  };

  return (
    <div
      onClick={closePhotoViewer}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-xl p-4 select-none"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between z-10 pt-safe">
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="font-headline font-bold text-xs uppercase tracking-wider text-[#4edea3]">
              {activePhotoModal.gameName}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#86948a]" />
            <span className="font-headline text-[10px] text-[#bbcabf] truncate">
              {activePhotoModal.sessionName}
            </span>
          </div>
          <span className="font-body text-[11px] text-[#86948a]">
            {new Date(activePhotoModal.uploadedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {/* Like button */}
          <button
            onClick={() => togglePhotoLike(activePhotoModal.id)}
            className="w-10 h-10 rounded-full bg-[#1c2028] border border-[#3c4a42]/40 text-[#ff7a73] flex items-center justify-center active:scale-90 transition-transform"
            title="Like memory"
          >
            <span className="material-symbols-outlined text-[20px]">favorite</span>
          </button>

          {/* Delete button */}
          <button
            onClick={() => openDeletePhotoModal(activePhotoModal, activePhotoModal.sessionId)}
            className="w-10 h-10 rounded-full bg-[#1c2028] border border-[#3c4a42]/40 text-[#bbcabf] hover:text-[#ffb4ab] flex items-center justify-center active:scale-90 transition-transform"
            title="Delete photo"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>

          {/* Close button */}
          <button
            onClick={closePhotoViewer}
            className="w-10 h-10 rounded-full bg-[#262a33] text-[#dfe2ee] hover:text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      {/* Main Photo Container with Prev/Next controls */}
      <div
        className="relative flex-1 flex items-center justify-center my-3 max-h-[72vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={activePhotoModal.storagePath}
          alt={activePhotoModal.caption}
          className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-[#3c4a42]/40"
        />

        {/* Previous Button */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-transform border border-white/20"
          >
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
          </button>
        )}

        {/* Next Button */}
        {currentIndex < allPhotos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-transform border border-white/20"
          >
            <span className="material-symbols-outlined text-2xl">chevron_right</span>
          </button>
        )}
      </div>

      {/* Bottom Photo Details Banner */}
      <div
        className="bg-[#181c24]/90 backdrop-blur-md border border-[#3c4a42]/40 rounded-2xl p-4 pb-safe flex flex-col gap-1 max-w-md mx-auto w-full z-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activePhotoModal.tag && (
              <span className="px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-headline text-[10px] font-bold uppercase tracking-wider">
                {activePhotoModal.tag}
              </span>
            )}
            {activePhotoModal.badge && (
              <span className="px-2 py-0.5 rounded bg-[#ffb95f]/20 text-[#ffb95f] font-headline text-[10px] font-bold uppercase">
                {activePhotoModal.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[#ff7a73] font-headline text-xs font-bold">
            <span className="material-symbols-outlined text-[15px]">favorite</span>
            <span>{activePhotoModal.likes || 0}</span>
          </div>
        </div>

        <h3 className="font-headline font-bold text-base text-[#dfe2ee]">
          {activePhotoModal.caption}
        </h3>

        {activePhotoModal.subCaption && (
          <p className="font-body text-xs text-[#bbcabf]">
            {activePhotoModal.subCaption}
          </p>
        )}

        {activePhotoModal.playerInitials && activePhotoModal.playerInitials.length > 0 && (
          <div className="flex items-center gap-1 pt-1 mt-1 border-t border-[#3c4a42]/30">
            <span className="font-headline text-[10px] text-[#86948a] uppercase mr-1">Tagged:</span>
            {activePhotoModal.playerInitials.map((init, i) => (
              <span
                key={i}
                className="w-5 h-5 rounded-full bg-[#262a33] text-[#4edea3] font-headline text-[10px] font-bold flex items-center justify-center border border-[#4edea3]/30"
              >
                {init}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
