// Thin wrapper around @capacitor/haptics with browser-vibrate fallback.
// Safe to call from anywhere — silently no-ops if neither is available.

let _haptics = null;
let _loadAttempted = false;

async function ensureLoaded() {
  if (_loadAttempted) return _haptics;
  _loadAttempted = true;
  try {
    const mod = await import('@capacitor/haptics');
    _haptics = mod;
  } catch {
    _haptics = null;
  }
  return _haptics;
}

// Kick off the import early so first call isn't delayed
ensureLoaded();

export const ImpactStyle = {
  Light: 'LIGHT',
  Medium: 'MEDIUM',
  Heavy: 'HEAVY',
};

const VIBRATE_FALLBACK = {
  LIGHT: 10,
  MEDIUM: 25,
  HEAVY: 50,
};

export const Haptics = {
  impact(style = ImpactStyle.Light) {
    if (_haptics?.Haptics?.impact) {
      _haptics.Haptics.impact({ style: _haptics.ImpactStyle?.[style.charAt(0) + style.slice(1).toLowerCase()] || style }).catch(() => { });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(VIBRATE_FALLBACK[style] || 10);
    }
  },
  notification(type = 'SUCCESS') {
    if (_haptics?.Haptics?.notification) {
      _haptics.Haptics.notification({ type: _haptics.NotificationType?.[type.charAt(0) + type.slice(1).toLowerCase()] || type }).catch(() => { });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const patterns = { SUCCESS: [10, 40, 10], WARNING: [20, 40, 20], ERROR: [50, 50, 50] };
      navigator.vibrate(patterns[type] || [10]);
    }
  },
};
