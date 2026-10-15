import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  tagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 36,
  className = '',
  showText = false,
  tagline = false
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official Score & Sip Monogram Logo (Priority 6) */}
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-0.5 transition-colors"
        aria-label="Score & Sip Logo"
      >
        <img
          src="/image.png"
          alt="Score & Sip Logo"
          className="w-full h-full object-contain rounded-xl"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col min-w-0 leading-tight">
          <span className="font-headline font-bold text-base tracking-tight text-[var(--text-primary)]">
            Score &amp; Sip
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
