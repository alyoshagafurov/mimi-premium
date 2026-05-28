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
      className="glass-luxury group relative overflow-hidden rounded-2xl p-4 transition-shadow sm:rounded-3xl sm:p-6"
    >
      {/* corner glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-glow-radial opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.2em] text-light/50 sm:text-[10px] sm:tracking-[0.24em]">{label}</div>
          <div className="mt-3 font-display text-2xl font-extrabold tracking-tight text-light sm:mt-5 sm:text-4xl">
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-brand-lime/25 bg-brand-lime/[0.06] text-brand-lime sm:h-11 sm:w-11 sm:rounded-2xl">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
