'use client';

import { motion } from 'framer-motion';

export type AudienceData = {
  age18_24: number;
  age25_34: number;
  age35_44: number;
  age45plus: number;
};

const ROWS: { key: keyof AudienceData; label: string }[] = [
  { key: 'age18_24', label: '18–24' },
  { key: 'age25_34', label: '25–34' },
  { key: 'age35_44', label: '35–44' },
  { key: 'age45plus', label: '45+' },
];

/** Horizontal bars showing the audience age split (values are percentages). */
export function AudienceChart({ data }: { data: AudienceData }) {
  const total = ROWS.reduce((s, r) => s + (data[r.key] || 0), 0);

  return (
    <div className="space-y-4">
      {ROWS.map((row, i) => {
        const value = data[row.key] || 0;
        const pct = total > 0 ? (value / total) * 100 : 0;
        return (
          <div key={row.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted">{row.label}</span>
              <span className="font-mono font-semibold text-light">{Math.round(pct)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-lime-gradient"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
