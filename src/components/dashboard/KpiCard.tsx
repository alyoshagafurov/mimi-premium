'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  delta,
  icon,
  delay = 0,
  format,
}: {
  label: string;
  value: string | number;
  delta?: number; // percent change
  icon?: React.ReactNode;
  delay?: number;
  format?: (n: number) => string;
}) {
  const display = typeof value === 'number' && format ? format(value) : value;
  const isPositive = (delta ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="glass-luxury group relative overflow-hidden rounded-3xl p-6 transition-shadow"
    >
      {/* corner glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-glow-radial opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-light/50">{label}</div>
          <div className="mt-5 font-display text-4xl font-extrabold tracking-tight text-light">
            {display}
          </div>
          {delta !== undefined && (
            <div className={cn('mt-3 inline-flex items-center gap-1.5 text-xs', isPositive ? 'text-brand-lime' : 'text-rose-400')}>
              <span className="text-base leading-none">{isPositive ? '↑' : '↓'}</span>
              <span className="font-medium">
                {isPositive ? '+' : ''}
                {Math.round(delta)}%
              </span>
              <span className="text-light/40">за месяц</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-lime/25 bg-brand-lime/[0.06] text-brand-lime">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
