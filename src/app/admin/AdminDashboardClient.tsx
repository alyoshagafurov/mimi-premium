'use client';

import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageHeader } from '@/components/admin/PageHeader';
import { SALES_STATUS_LABEL, type SalesStatus } from '@/lib/roles';
import { formatInt, formatMoney, cn } from '@/lib/utils';

type Stats = {
  activeProjects: number;
  staffCount: number;
  activeTasks: number;
  totalRevenue: number;
  totalClients: number;
};
type Crm = { status: string; count: number }[];

export function AdminDashboardClient({
  me,
  showRevenue = true,
  stats,
  crm,
  revenueTrend,
}: {
  me: string;
  showRevenue?: boolean;
  stats: Stats;
  crm: Crm;
  revenueTrend: { label: string; amount: number }[];
}) {
  const tooltipStyle = {
    background: 'rgba(10,7,18,0.95)',
    border: '1px solid rgba(212,236,76,0.3)',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 12,
    boxShadow: '0 30px 60px -20px rgba(0,0,0,0.7)',
  };
  const maxCrm = Math.max(...crm.map((c) => c.count), 1);

  return (
    <div className="space-y-5 sm:space-y-8">
      <PageHeader
        eyebrow="Cabin"
        title={<>С возвращением, <span className="text-lime-grad">{me.split(' ')[0]}</span></>}
        subtitle="Финансы, проекты и воронка агентства — в одном экране."
      />

      {/* KPIs — финансовая аналитика */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {showRevenue ? (
          <KpiCard label="Общая выручка" value={formatMoney(stats.totalRevenue)} delay={0} icon={<span className="text-sm">$</span>} />
        ) : (
          <KpiCard label="Клиентов" value={formatInt(stats.totalClients)} delay={0} icon={<span className="text-sm">◷</span>} />
        )}
        <KpiCard label="Активные проекты" value={formatInt(stats.activeProjects)} delay={0.05} icon={<span className="text-sm">◍</span>} />
        <KpiCard label="Сотрудников" value={formatInt(stats.staffCount)} delay={0.1} icon={<span className="text-sm">◆</span>} />
        <KpiCard label="Активные задачи" value={formatInt(stats.activeTasks)} delay={0.15} icon={<span className="text-sm">✓</span>} />
      </div>

      {/* CRM quick stats + revenue by month */}
      <div className={cn('grid gap-5', showRevenue && 'lg:grid-cols-2')}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass-luxury rounded-2xl p-4 sm:rounded-3xl sm:p-7"
        >
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-light/50">CRM</p>
            <h2 className="mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">Быстрая статистика</h2>
          </div>
          <div className="space-y-3">
            {crm.map((c) => (
              <div key={c.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-light/70">{SALES_STATUS_LABEL[c.status as SalesStatus]}</span>
                  <span className="text-muted">{c.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-lime-gradient" style={{ width: `${(c.count / maxCrm) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {showRevenue && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="glass-luxury rounded-2xl p-4 sm:rounded-3xl sm:p-7"
          >
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-light/50">Finance</p>
              <h2 className="mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">Выручка по месяцам</h2>
            </div>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E4F47A" />
                      <stop offset="100%" stopColor="#A8BD2F" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(245,241,250,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: 'rgba(245,241,250,0.5)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(v)}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(212,236,76,0.05)' }} labelStyle={{ color: '#D4EC4C' }} formatter={(v: number) => [formatMoney(v), 'Выручка']} />
                  <Bar dataKey="amount" fill="url(#revFill)" radius={[8, 8, 0, 0]} animationDuration={1100} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}
