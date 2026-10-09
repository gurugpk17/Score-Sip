import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  tagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 32,
  className = '',
  showText = false,
  tagline = false
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Modern Minimal "S" Icon Mark with Card & Sip motif */}
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-gradient-to-br from-[#0f2b20] to-[#091812] border border-[#10b981]/30 p-1"
        aria-label="Score & Sip Logo"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logo-primary" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#4edea3" />
              <stop offset="100%" stop-color="#10b981" />
            </linearGradient>
          </defs>
          {/* Main S-spine */}
          <path
            d="M67 31C63 24 55 21 47 21C34 21 25 29 25 40C25 53 38 56 52 60C67 64 74 70 74 79C74 90 62 94 49 94C37 94 28 88 23 80"
            stroke="url(#logo-primary)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Cup/sip rim arc */}
          <path
            d="M57 22C68 22 76 27 76 36C76 43 69 48 59 48"
            stroke="#ffb95f"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          {/* Sip spark */}
          <circle cx="77" cy="21" r="5" fill="#ffb95f" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0 leading-tight">
          <span className="font-headline font-bold text-base tracking-tight text-[var(--text-primary)]">
            Score & Sip
          </span>
          {tagline && (
            <span className="font-body text-[10px] text-[var(--text-muted)] tracking-wide">
              Keep the score. Enjoy the game.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
