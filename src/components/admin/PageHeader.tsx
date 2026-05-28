'use client';

import { motion } from 'framer-motion';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.42em] text-brand-orange">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-light sm:mt-3 sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[13px] text-light/60 sm:mt-3 sm:text-sm md:text-base">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </motion.div>
  );
}
