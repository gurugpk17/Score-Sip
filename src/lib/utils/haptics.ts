let hapticsActive = true;

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('score_sip_haptics_enabled');
  if (saved !== null) {
    hapticsActive = saved === 'true';
  }
}

export function setHapticsEnabled(enabled: boolean) {
  hapticsActive = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('score_sip_haptics_enabled', String(enabled));
  }
}

export function getHapticsEnabled(): boolean {
  return hapticsActive;
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error' = 'light') {
  if (!hapticsActive) return;
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'light':
      case 'selection':
        navigator.vibrate(8);
        break;
      case 'medium':
        navigator.vibrate(18);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
      case 'success':
        navigator.vibrate([12, 25, 18]);
        break;
      case 'error':
        navigator.vibrate([25, 30, 25]);
        break;
    }
  } catch {
    // Ignore unsupported vibration errors
  }
}
