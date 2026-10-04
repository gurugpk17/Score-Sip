import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export const ConfettiRain: React.FC = () => {
  useEffect(() => {
    // Fire burst of confetti
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#4edea3', '#ffb95f', '#ff7a73', '#6ffbbe', '#ffffff']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#4edea3', '#ffb95f', '#ff7a73', '#6ffbbe', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return null;
};
