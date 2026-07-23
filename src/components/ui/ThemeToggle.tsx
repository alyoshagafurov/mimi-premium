'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export const THEME_KEY = 'mimi-theme';
type Theme = 'dark' | 'light';

/** Applies the theme to <html> and remembers the choice. */
function apply(theme: Theme) {
  const el = document.documentElement;
  if (theme === 'light') el.setAttribute('data-theme', 'light');
  else el.removeAttribute('data-theme');
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode — theme just won't persist */
  }
}

/**
 * Dark / light switch. Dark stays the brand default; light is opt-in and
 * persisted, so the choice survives navigation and reloads.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    setTheme(current);
    setReady(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    apply(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      className={cn(
        'group relative flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-light/60 transition-all duration-300 hover:border-brand-lime/50 hover:text-brand-lime',
        !ready && 'opacity-0',
        className,
      )}
    >
      {theme === 'dark' ? (
        // Sun — switch to light
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // Moon — switch to dark
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
