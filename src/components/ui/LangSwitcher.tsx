'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const LANGS = ['Tj', 'Ru', 'En'] as const;
type Lang = (typeof LANGS)[number];

/**
 * Language switcher (Tj / Ru / En). Rendered at 50% opacity per brand spec.
 * Visual state only for now — full localization is a separate task.
 */
export function LangSwitcher({ className }: { className?: string }) {
  const [active, setActive] = useState<Lang>('Ru');
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-1 py-1 opacity-50 transition-opacity hover:opacity-100',
        className,
      )}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setActive(l)}
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors',
            active === l ? 'bg-brand-lime text-ink' : 'text-light/70 hover:text-brand-lime',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
