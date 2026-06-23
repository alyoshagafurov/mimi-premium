'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Single KPI tile with a value and an optional month-over-month delta.
 * `delta` is a percent change (e.g. 12 → "+12% за месяц").
 */
export function MetricCard({
  label,
  value,
  delta,
  delay = 0,
}: {
  label: string;
  value: string | number;
  delta?: number | null;
  delay?: number;
}) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const isPositive = (delta ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="glass-luxury group relative overflow-hidden rounded-2xl p-4 sm:rounded-3xl sm:p-6"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-glow-radial opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      <div className="relative">
        <div className="text-[9px] uppercase tracking-[0.2em] text-light/50 sm:text-[10px] sm:tracking-[0.24em]">
          {label}
        </div>
        <div className="mt-3 font-display text-2xl font-extrabold tracking-tight text-light sm:mt-5 sm:text-4xl">
          {value}
        </div>
        {hasDelta && (
          <div
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 text-xs',
              isPositive ? 'text-brand-lime' : 'text-rose-400',
            )}
          >
            <span className="text-base leading-none">{isPositive ? '↑' : '↓'}</span>
            <span className="font-medium">
              {isPositive ? '+' : ''}
              {Math.round(delta!)}%
            </span>
            <span className="text-light/40">за месяц</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
