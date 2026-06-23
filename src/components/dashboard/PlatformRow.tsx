'use client';

import { motion } from 'framer-motion';
import { formatMoney, formatRoas } from '@/lib/utils';

/** Brand glyph + tint per known platform; falls back to a neutral dot. */
const META: Record<string, { letter: string; tint: string }> = {
  Instagram: { letter: 'Ig', tint: 'text-brand-orange border-brand-orange/40 bg-brand-orange/10' },
  Facebook: { letter: 'Fb', tint: 'text-brand-purpleSoft border-brand-purpleLight/40 bg-brand-purple/15' },
};

export function PlatformRow({
  name,
  spent,
  roas,
  index = 0,
}: {
  name: string;
  spent: number;
  roas: number;
  index?: number;
}) {
  const meta = META[name] ?? { letter: name.slice(0, 2), tint: 'text-light/70 border-white/15 bg-white/[0.04]' };
  const good = roas >= 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl border text-[11px] font-bold uppercase ${meta.tint}`}
        >
          {meta.letter}
        </span>
        <span className="font-medium text-light">{name}</span>
      </div>
      <div className="flex items-center gap-6 text-right">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Потрачено</div>
          <div className="text-sm font-semibold text-light">{formatMoney(spent)}</div>
        </div>
        <div className="min-w-[64px]">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted">ROAS</div>
          <div className={`text-sm font-semibold ${good ? 'text-brand-lime' : 'text-brand-orange'}`}>
            {formatRoas(roas)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
