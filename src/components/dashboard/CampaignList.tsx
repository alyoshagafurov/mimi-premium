'use client';

import { motion } from 'framer-motion';
import { StatusPill } from '@/components/ui/StatusPill';

export type CampaignItem = {
  id: string;
  name: string;
  platform: string;
  status: string;
};

/** Read-only list of campaigns with their current status, for the client dashboard. */
export function CampaignList({ campaigns }: { campaigns: CampaignItem[] }) {
  if (!campaigns.length) {
    return (
      <p className="text-sm text-muted">
        Кампаний пока нет. Менеджер запустит первые в течение 48 часов.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {campaigns.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
        >
          <div className="min-w-0">
            <div className="truncate font-medium text-light">{c.name}</div>
            <div className="text-[11px] text-muted">{c.platform}</div>
          </div>
          <StatusPill status={c.status} />
        </motion.div>
      ))}
    </div>
  );
}
