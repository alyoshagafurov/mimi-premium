'use client';

import { cn } from '@/lib/utils';
import { LANGS } from '@/i18n/config';
import { useI18n } from '@/i18n/LanguageProvider';

const LANG_NAMES: Record<string, string> = { tg: 'Тоҷикӣ', ru: 'Русский', en: 'English' };

/** Language switcher (Tj / Ru / En). Rendered at 50% opacity, full on hover. */
export function LangSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      role="group"
      aria-label="Выбор языка"
      className={cn(
        'flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-1 py-1 opacity-50 transition-opacity hover:opacity-100',
        className,
      )}
    >
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          aria-label={LANG_NAMES[l.code] ?? l.label}
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors',
            lang === l.code ? 'bg-brand-lime text-[#0A0712]' : 'text-light/70 hover:text-brand-lime',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
