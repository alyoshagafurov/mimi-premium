'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Autosave a form to localStorage (debounced). SSR-safe: never reads storage
 * during render, so no hydration mismatch. Only enable for NEW records.
 * Returns [value, setValue, { restored, clear }].
 */
export function useDraft<T>(key: string, initial: T, enabled: boolean) {
  const [value, setValue] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const loaded = useRef(false);

  // Load any saved draft on mount (client only).
  useEffect(() => {
    if (!enabled || loaded.current) return;
    loaded.current = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setValue(JSON.parse(raw));
        setRestored(true);
      }
    } catch {
      /* ignore */
    }
  }, [enabled, key]);

  // Debounced save on change.
  useEffect(() => {
    if (!enabled || !loaded.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* ignore */
      }
    }, 700);
    return () => clearTimeout(t);
  }, [value, enabled, key]);

  const clear = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setRestored(false);
  };

  return [value, setValue, { restored, clear }] as const;
}
