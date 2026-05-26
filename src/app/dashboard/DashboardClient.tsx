'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RomiChart } from '@/components/dashboard/RomiChart';
import { FunnelViz } from '@/components/dashboard/FunnelViz';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatInt, formatPct, formatRub, tariffLabel } from '@/lib/utils';

export function DashboardClient({
  user,
  kpi,
  chart,
  funnel,
  leads,
  campaigns,
  business,
}: {
  user: { name: string; tariff: string; tariffEnd: string | null };
  kpi: { spent: number; leads: number; sales: number; romi: number; spentDelta: number; leadsDelta: number; salesDelta: number; romiDelta: number };
  chart: { date: string; romi: number; revenue: number }[];
  funnel: { label: string; value: number }[];
  leads: { id: string; name: string; contact: string; source: string; status: string; createdAt: string }[];
  campaigns: { id: string; name: string; platform: string; budget: number; spent: number; leads: number; sales: number; romi: number; status: string }[];
  business: { name: string; niche: string };
}) {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-20 pt-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Командный центр</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight md:text-4xl">
            Здравствуйте, <span className="text-gold-grad">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {business.name} · {business.niche}
          </p>
        </div>
        <div className="glass-gold flex items-center justify-between gap-6 rounded-2xl px-5 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted">Тариф</div>
            <div className="font-display text-lg font-bold text-gold-grad">{tariffLabel(user.tariff)}</div>
            {user.tariffEnd && (
              <div className="mt-0.5 text-[11px] text-muted">
                до {format(new Date(user.tariffEnd), 'd MMMM yyyy', { locale: ru })}
              </div>
            )}
          </div>
          <Link href="/pricing" className="btn-ghost !px-4 !py-2 !text-[10px]">
            Сменить
          </Link>
        </div>
      </motion.div>

      {/* KPI ROW */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Потрачено за месяц" value={formatRub(kpi.spent)} delta={kpi.spentDelta} delay={0} />
        <KpiCard label="Лиды" value={formatInt(kpi.leads)} delta={kpi.leadsDelta} delay={0.08} />
        <KpiCard label="Продажи" value={formatInt(kpi.sales)} delta={kpi.salesDelta} delay={0.16} />
        <KpiCard label="ROMI" value={formatPct(kpi.romi, true)} delta={kpi.romiDelta} delay={0.24} />
      </div>

      {/* CHART + FUNNEL */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">ROMI по неделям</h2>
              <p className="text-xs text-muted">Динамика окупаемости за 12 недель</p>
            </div>
            <span className="chip text-gold">Live</span>
          </div>
          <RomiChart data={chart} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="font-display text-lg font-bold">Воронка</h2>
          <p className="mb-4 text-xs text-muted">Клик → Продажа за 4 недели</p>
          <FunnelViz stages={funnel} />
        </motion.div>
      </div>

      {/* CAMPAIGNS + LEADS */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="mb-4 font-display text-lg font-bold">Активные кампании</h2>
          <div className="space-y-4">
            {campaigns.map((c) => {
              const pct = c.budget > 0 ? Math.min(100, (c.spent / c.budget) * 100) : 0;
              return (
                <div key={c.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-light">{c.name}</div>
                      <div className="text-[11px] text-muted">{c.platform}</div>
                    </div>
                    <StatusPill status={c.status} />
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                      <span>Бюджет</span>
                      <span>
                        <span className="text-light">{formatRub(c.spent)}</span> / {formatRub(c.budget)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gold-gradient transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-4 text-[11px] text-muted">
                    <span>
                      Лиды: <span className="text-light">{formatInt(c.leads)}</span>
                    </span>
                    <span>
                      Продажи: <span className="text-light">{formatInt(c.sales)}</span>
                    </span>
                    <span className="text-gold">ROMI {formatPct(c.romi, true)}</span>
                  </div>
                </div>
              );
            })}
            {!campaigns.length && (
              <p className="text-sm text-muted">Кампаний пока нет. Менеджер запустит первые в течение 48 часов.</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="glass rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Последние лиды</h2>
            <span className="chip">10 свежих</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.16em] text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Имя</th>
                  <th className="px-3 py-2 text-left">Источник</th>
                  <th className="px-3 py-2 text-left">Дата</th>
                  <th className="px-3 py-2 text-right">Статус</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-t border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-light">{l.name}</div>
                      <div className="text-[11px] text-muted">{l.contact}</div>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{l.source}</td>
                    <td className="px-3 py-2.5 text-muted">
                      {format(new Date(l.createdAt), 'd MMM, HH:mm', { locale: ru })}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <StatusPill status={l.status} />
                    </td>
                  </tr>
                ))}
                {!leads.length && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted">Пока нет лидов</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
