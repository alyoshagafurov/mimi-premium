'use client';

import { motion } from 'framer-motion';
import { formatInt } from '@/lib/utils';

type Stage = { label: string; value: number };

export function FunnelViz({ stages }: { stages: Stage[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const width = (s.value / max) * 100;
        const drop = i > 0 ? Math.round((1 - s.value / stages[i - 1].value) * 100) : 0;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted">{s.label}</span>
              <div className="flex items-center gap-3">
                {i > 0 && <span className="text-[10px] text-red-400/80">−{drop}%</span>}
                <span className="font-mono font-semibold text-light">{formatInt(s.value)}</span>
              </div>
            </div>
            <div className="relative h-9 overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full bg-emerald-gold"
              >
                <div className="absolute inset-0 animate-pulse bg-white/5" />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
