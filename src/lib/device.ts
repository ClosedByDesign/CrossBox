import { useEffect, useSyncExternalStore } from 'react';
import { useDemoStore } from '../store';

export type LayoutMode = 'auto' | 'mobile' | 'desktop';

/** Schmaler Touch-Screen – greift, wenn der User-Agent nichts verrät */
const NARROW_TOUCH = '(pointer: coarse) and (max-width: 767px)';

/**
 * Erkennt ein Smartphone. Tablets bekommen weiter das Web-Layout, weil dort
 * Sidebar und Tabellen genug Platz haben.
 */
export function detectPhone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  const shortSide = Math.min(window.screen.width, window.screen.height);
  if (nav.userAgentData?.mobile) return shortSide < 600;
  if (/Android.+Mobile|iPhone|iPod|Windows Phone|IEMobile|Opera Mini|Mobile Safari/i.test(nav.userAgent)) {
    return shortSide < 600;
  }
  return window.matchMedia(NARROW_TOUCH).matches;
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(NARROW_TOUCH);
  media.addEventListener('change', onChange);
  window.addEventListener('orientationchange', onChange);
  return () => {
    media.removeEventListener('change', onChange);
    window.removeEventListener('orientationchange', onChange);
  };
}

/** true, wenn das Mobil-Layout ausgeliefert wird (automatisch erkannt oder in der Demo erzwungen) */
export function useIsMobileLayout() {
  const mode = useDemoStore((s) => s.prefs.layout ?? 'auto');
  const phone = useSyncExternalStore(subscribe, detectPhone, () => false);
  return mode === 'mobile' || (mode === 'auto' && phone);
}

/**
 * Schreibt das aktive Layout als data-layout an <html>, damit die Tailwind-Variante
 * `mobile:` greift. `?layout=mobile|desktop|auto` in der URL überschreibt die Erkennung.
 */
export function LayoutManager() {
  const setPrefs = useDemoStore((s) => s.setPrefs);
  const mobile = useIsMobileLayout();

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('layout');
    if (requested === 'mobile' || requested === 'desktop' || requested === 'auto') setPrefs({ layout: requested });
  }, [setPrefs]);

  useEffect(() => {
    document.documentElement.dataset.layout = mobile ? 'mobile' : 'desktop';
  }, [mobile]);

  return null;
}
