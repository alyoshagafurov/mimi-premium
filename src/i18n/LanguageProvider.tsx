'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { DEFAULT_LANG, LANG_COOKIE, type Lang } from './config';

type Ctx = { lang: Lang; setLang: (l: Lang) => void };

const LanguageContext = createContext<Ctx>({ lang: DEFAULT_LANG, setLang: () => {} });

export function LanguageProvider({
  initialLang = DEFAULT_LANG,
  children,
}: {
  initialLang?: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    try {
      localStorage.setItem(LANG_COOKIE, l);
    } catch {
      /* ignore */
    }
  }, []);

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export const useI18n = () => useContext(LanguageContext);
export const useLang = (): Lang => useContext(LanguageContext).lang;

/**
 * Pick the slice of a co-located copy object for the active language.
 *
 *   const COPY: Record<Lang, T> = { ru, en, tg };
 *   const t = useCopy(COPY);   // → t.title, t.items, …
 */
export function useCopy<T>(copy: Record<Lang, T>): T {
  return copy[useLang()];
}
