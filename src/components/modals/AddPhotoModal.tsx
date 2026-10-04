import React, { useRef, useState } from 'react';
import { useSessionStore } from '../../features/session/sessionStore';
import { compressImageFile } from '../../lib/storage/db';
import { triggerHaptic } from '../../lib/utils/haptics';

export const AddPhotoModal: React.FC = () => {
  const {
    addPhotoModalSessionId,
    closeAddPhotoModal,
    addPhotoToSession,
    historySessions,
    activeSession
  } = useSessionStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('Table Action');
  const [subCaption, setSubCaption] = useState('Game night felt snap');
  const [selectedTag, setSelectedTag] = useState('TABLE ACTION');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!addPhotoModalSessionId) return null;

  const targetSession = historySessions.find(s => s.id === addPhotoModalSessionId) || activeSession;
  if (!targetSession) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      triggerHaptic('light');
      const { dataUrl, thumbnailUrl } = await compressImageFile(file, 1200, 0.85);
      setPreviewUrl(dataUrl);
      setThumbnailUrl(thumbnailUrl);
    } catch {
      // Fallback: standard file reader
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        setThumbnailUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!previewUrl) return;
    triggerHaptic('success');

    addPhotoToSession(targetSession.id, {
      sessionId: targetSession.id,
      sessionName: targetSession.name,
      gameName: targetSession.gameConfig.name,
      storagePath: previewUrl,
      thumbnailUrl: thumbnailUrl || previewUrl,
      caption: caption.trim() || 'Game Night Moment',
      subCaption: subCaption.trim() || undefined,
      tag: selectedTag,
      playerInitials: targetSession.players.slice(0, 3).map(p => p.initials)
    });
  };

  const tags = [
    'TABLE ACTION',
    'ROUND 5 CARD FLIP',
    'TEA DUTY',
    'GURU CROWNED',
    'CHAI STAKE',
    'FESTIVE NIGHT'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#181c24] border border-[#3c4a42]/60 rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#3c4a42]/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-2xl">photo_camera</span>
            <div>
              <h2 className="font-headline font-bold text-base text-[#dfe2ee]">
                Add Game Snap
              </h2>
              <span className="font-headline text-[10px] text-[#86948a] uppercase">
                {targetSession.name}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              closeAddPhotoModal();
            }}
            className="w-8 h-8 rounded-full bg-[#262a33] text-[#bbcabf] hover:text-[#dfe2ee] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Image Preview or Selector */}
        {!previewUrl ? (
          <div className="flex flex-col gap-2.5">
            <div
              onClick={() => cameraInputRef.current?.click()}
              className="h-32 rounded-2xl border-2 border-dashed border-[#4edea3]/40 bg-[#1c2028] hover:bg-[#262a33] flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-[#4edea3]/20 text-[#4edea3] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">photo_camera</span>
              </div>
              <span className="font-headline font-bold text-xs text-[#dfe2ee] uppercase">
                Take Photo with Camera
              </span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-16 rounded-xl border border-[#3c4a42]/50 bg-[#1c2028] hover:bg-[#262a33] flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[#ffb95f] text-xl">image</span>
              <span className="font-headline text-xs font-bold text-[#dfe2ee] uppercase">
                Choose from Device Gallery
              </span>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-[#3c4a42]/60 max-h-56 bg-black flex items-center justify-center">
            <img src={previewUrl} alt="Preview" className="max-h-56 w-full object-cover" />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70 text-white font-headline text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-sm">replay</span>
              Change
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 text-xs text-[#4edea3] font-headline font-bold">
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            <span>Optimizing snap...</span>
          </div>
        )}

        {/* Caption & Tag Controls */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="font-headline text-[10px] font-bold uppercase tracking-wider text-[#bbcabf]">
              Snap Tag / Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTag(t)}
                  className={`px-2.5 py-1 rounded-full font-headline text-[10px] font-bold transition-all ${
                    selectedTag === t
                      ? 'bg-[#4edea3] text-[#003824]'
                      : 'bg-[#262a33] text-[#bbcabf] hover:text-[#dfe2ee]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-headline text-[10px] font-bold uppercase tracking-wider text-[#bbcabf]">
              Caption Title
            </label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="e.g. Round 5 Showdown"
              className="w-full h-11 px-3 rounded-xl bg-[#262a33] border border-[#3c4a42] text-[#dfe2ee] font-body text-xs focus:outline-none focus:border-[#4edea3]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-headline text-[10px] font-bold uppercase tracking-wider text-[#bbcabf]">
              Note / Description
            </label>
            <input
              type="text"
              value={subCaption}
              onChange={e => setSubCaption(e.target.value)}
              placeholder="e.g. Suresh caught with 70 pts deadwood"
              className="w-full h-11 px-3 rounded-xl bg-[#262a33] border border-[#3c4a42] text-[#dfe2ee] font-body text-xs focus:outline-none focus:border-[#4edea3]"
            />
          </div>
        </div>

        {/* Confirm Add Button */}
        <button
          onClick={handleSave}
          disabled={!previewUrl || isProcessing}
          className={`w-full h-12 rounded-xl font-headline font-bold text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer ${
            previewUrl && !isProcessing
              ? 'bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] shadow-[0_4px_16px_rgba(78,222,163,0.3)]'
              : 'bg-[#262a33] text-[#86948a] cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
          <span>Save Snap to Match</span>
        </button>
      </div>
    </div>
  );
};
