import React from 'react';
import { useSessionStore } from '../../features/session/sessionStore';
import { triggerHaptic } from '../../lib/utils/haptics';

export const DeleteSnapModal: React.FC = () => {
  const { deleteConfirmPhoto, closeDeletePhotoModal, deletePhotoFromSession } = useSessionStore();

  if (!deleteConfirmPhoto) return null;

  const { photo, sessionId } = deleteConfirmPhoto;

  const handleDelete = () => {
    triggerHaptic('heavy');
    deletePhotoFromSession(sessionId, photo.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#181c24] border border-[#3c4a42]/60 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center gap-3">
        {/* Trash Icon Badge */}
        <div className="w-14 h-14 rounded-full bg-[#93000a]/30 border border-[#93000a]/50 flex items-center justify-center text-[#ffb4ab] mb-1">
          <span className="material-symbols-outlined text-[26px]">delete</span>
        </div>

        {/* Title & Tagline */}
        <div className="flex flex-col gap-1">
          <h2 className="font-headline font-bold text-xl text-[#dfe2ee]">
            Delete this Game Snap?
          </h2>
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-[#ff7a73]">
            IRREVERSIBLE ACTION
          </span>
        </div>

        {/* Description */}
        <p className="font-body text-xs text-[#bbcabf] leading-relaxed">
          This will permanently remove the photo from the{' '}
          <strong className="text-[#dfe2ee]">“{photo.sessionName}”</strong> session and your shared squad ledger.
        </p>

        {/* Shield Info Badge */}
        <div className="w-full bg-[#1c2028] border border-[#3c4a42]/40 rounded-xl p-3 flex items-center gap-2.5 text-left mt-1">
          <span className="material-symbols-outlined text-[#4edea3] text-[18px] shrink-0">
            verified_user
          </span>
          <span className="font-body text-[11px] text-[#bbcabf] leading-tight">
            Game scores, dealer penalties, and round stats remain untouched.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full mt-2">
          <button
            onClick={handleDelete}
            className="w-full h-12 rounded-xl bg-[#93000a] hover:bg-[#ba1a1a] text-[#ffdad6] font-headline font-bold text-sm uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <span>Delete Photo</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              closeDeletePhotoModal();
            }}
            className="w-full h-12 rounded-xl bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] font-headline font-bold text-sm uppercase flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            Keep Snap
          </button>
        </div>
      </div>
    </div>
  );
};
