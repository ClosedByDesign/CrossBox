import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDemoStore } from '../../store';

/** Setzt die Theme-Klasse am <html>-Element und folgt bei "system" der Systemeinstellung */
export function ThemeManager() {
  const theme = useDemoStore((s) => s.prefs.theme);
  const locale = useDemoStore((s) => s.prefs.locale);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      root.classList.toggle('dark', dark);
    };

    apply();
    if (theme === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

export function ThemeToggle() {
  const theme = useDemoStore((s) => s.prefs.theme);
  const setPrefs = useDemoStore((s) => s.setPrefs);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      type="button"
      onClick={() => setPrefs({ theme: isDark ? 'light' : 'dark' })}
      className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-ink"
      aria-label={isDark ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'}
      title={isDark ? 'Helles Design' : 'Dunkles Design'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
