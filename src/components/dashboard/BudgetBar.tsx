'use client';

import { motion } from 'framer-motion';
import { formatMoney } from '@/lib/utils';

/** Thin, minimalist budget progress bar: spent vs. total budget. */
export function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const remaining = Math.max(0, budget - spent);
  const over = spent > budget;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-light/50">Бюджет месяца</div>
          <div className="mt-2 font-display text-2xl font-extrabold text-light">
            {formatMoney(spent)}
          </div>
          <div className="mt-1 text-xs text-muted">из {formatMoney(budget)}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-lg font-bold text-brand-lime">{Math.round(pct)}%</div>
          <div className="text-[11px] text-muted">
            {over ? 'перерасход' : `остаток ${formatMoney(remaining)}`}
          </div>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={cnBar(over)}
        />
      </div>
    </div>
  );
}

function cnBar(over: boolean) {
  return `h-full rounded-full ${over ? 'bg-brand-orange' : 'bg-lime-gradient'}`;
}
