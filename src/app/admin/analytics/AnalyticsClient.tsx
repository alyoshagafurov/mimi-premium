'use client';

import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { PageHeader } from '@/components/admin/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { formatInt, formatMoney, formatPct } from '@/lib/utils';

type Stats = {
  totalRevenue: number;
  avgCheck: number;
  clientsTotal: number;
  clientsActive: number;
  dealsTotal: number;
  dealsWon: number;
  conversionRate: number;
  retentionRate: number;
  openTasks: number;
  invoicesPaid: number;
  invoicesOverdue: number;
};

export function AnalyticsClient({
  stats,
  revenueByMonth,
  tariffDist,
}: {
  stats: Stats;
  revenueByMonth: { label: string; amount: number }[];
  tariffDist: { tariff: string; count: number }[];
}) {
  const tooltipStyle = {
    background: 'rgba(10,7,18,0.95)',
    border: '1px solid rgba(212,236,76,0.3)',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 12,
  };
  return (
    <div className="space-y-5 sm:space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title={<>Аналитика агентства</>}
        subtitle="Финансы, воронка, удержание клиентов и распределение по тарифам."
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <KpiCard label="Выручка год" value={formatMoney(stats.totalRevenue)} delay={0} icon={<span>$</span>} />
        <KpiCard label="Средний чек" value={formatMoney(stats.avgCheck)} delay={0.05} icon={<span>◐</span>} />
        <KpiCard label="Конверсия" value={formatPct(stats.conversionRate)} delay={0.1} icon={<span>↗</span>} />
        <KpiCard label="Retention" value={formatPct(stats.retentionRate)} delay={0.15} icon={<span>◆</span>} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-light/45">Клиенты</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-light">{formatInt(stats.clientsActive)}</span>
            <span className="text-sm text-light/45">/ {formatInt(stats.clientsTotal)}</span>
          </div>
          <p className="mt-1 text-[11px] text-light/45">активны / всего</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-light/45">Сделки</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-light">{formatInt(stats.dealsWon)}</span>
            <span className="text-sm text-light/45">/ {formatInt(stats.dealsTotal)}</span>
          </div>
          <p className="mt-1 text-[11px] text-light/45">выиграны / всего</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-light/45">Счета</p>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <div className="font-display text-2xl font-extrabold text-brand-lime">{formatInt(stats.invoicesPaid)}</div>
              <div className="text-[10px] text-light/45">оплачено</div>
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-rose-300">{formatInt(stats.invoicesOverdue)}</div>
              <div className="text-[10px] text-light/45">просрочено</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass-luxury rounded-3xl p-5 sm:p-7"
        >
          <h2 className="font-display text-xl font-extrabold text-light">Выручка по месяцам</h2>
          <p className="mt-1 text-[11px] text-light/45">Сумма оплаченных счетов в течение года</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4EC4C" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#D4EC4C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(245,241,250,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(245,241,250,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatMoney(v), 'Выручка']} />
                <Area dataKey="amount" stroke="#D4EC4C" strokeWidth={2.5} fill="url(#revArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="glass-luxury rounded-3xl p-5 sm:p-7"
        >
          <h2 className="font-display text-xl font-extrabold text-light">Тарифы</h2>
          <p className="mt-1 text-[11px] text-light/45">Распределение клиентов по тарифам</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tariffDist} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="tariff" tick={{ fill: 'rgba(245,241,250,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(245,241,250,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#D4EC4C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-light/45">Открытые задачи</p>
        <div className="mt-2 font-display text-2xl font-extrabold text-light">{stats.openTasks}</div>
        <p className="text-[11px] text-light/45">требуют внимания команды</p>
      </div>
    </div>
  );
}
