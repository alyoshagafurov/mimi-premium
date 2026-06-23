export type Lang = 'ru' | 'en' | 'tg';

/** Switcher order + display labels. Internal codes: ru / en / tg (Tajik). */
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'tg', label: 'Tj' },
  { code: 'ru', label: 'Ru' },
  { code: 'en', label: 'En' },
];

export const DEFAULT_LANG: Lang = 'ru';
export const LANG_COOKIE = 'lang';

export const isLang = (v: unknown): v is Lang => v === 'ru' || v === 'en' || v === 'tg';
