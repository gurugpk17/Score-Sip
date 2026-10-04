import React from 'react';
import { useSessionStore } from '../../features/session/sessionStore';

export const Toast: React.FC = () => {
  const { toastMessage } = useSessionStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#31353e]/95 border border-[#3c4a42] text-[#dfe2ee] text-xs font-headline flex items-center gap-2 shadow-2xl z-50 animate-bounce">
      <span className="material-symbols-outlined text-[#4edea3] text-[18px]">check_circle</span>
      <span>{toastMessage}</span>
    </div>
  );
};
