'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  dealStageLabel,
  dealStageAccent,
  formatInt,
  formatMoney,
  formatDate,
  isOverdue,
  cn,
} from '@/lib/utils';

type Stats = { totalClients: number; activeClients: number; activeDeals: number; revenueMonth: number; overdue: number };
type Pipeline = { stage: string; count: number; sum: number }[];
type TaskItem = { id: string; title: string; dueDate: string | null; context: string | null };
type Renewal = { businessName: string; tariff: string; daysLeft: number };

export function AdminDashboardClient({
  me,
  showRevenue = true,
  stats,
  pipeline,
  revenueTrend,
  tasks,
  renewals,
}: {
  me: string;
  showRevenue?: boolean;
  stats: Stats;
  pipeline: Pipeline;
  revenueTrend: { label: string; amount: number }[];
  tasks: TaskItem[];
  renewals: Renewal[];
}) {
  const tooltipStyle = {
    background: 'rgba(10,7,18,0.95)',
    border: '1px solid rgba(212,236,76,0.3)',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 12,
    boxShadow: '0 30px 60px -20px rgba(0,0,0,0.7)',
  };
  const maxPipeline = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <div className="space-y-5 sm:space-y-8">
      <PageHeader
        eyebrow="Cabin"
        title={<>С возвращением, <span className="text-lime-grad">{me.split(' ')[0]}</span></>}
        subtitle="Воронка, задачи и финансы агентства — в одном экране."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <KpiCard label="Клиентов" value={formatInt(stats.totalClients)} delay={0} icon={<span className="text-sm">◷</span>} />
        <KpiCard label="Активные сделки" value={formatInt(stats.activeDeals)} delay={0.05} icon={<span className="text-sm">◐</span>} />
        {showRevenue ? (
          <>
            <KpiCard label="Выручка за месяц" value={formatMoney(stats.revenueMonth)} delay={0.1} icon={<span className="text-sm">$</span>} />
            <KpiCard label="Долг" value={formatMoney(stats.overdue)} delay={0.15} icon={<span className="text-sm">!</span>} />
          </>
        ) : (
          <KpiCard label="Активные клиенты" value={formatInt(stats.activeClients)} delay={0.1} icon={<span className="text-sm">◍</span>} />
        )}
      </div>

      {/* Pipeline + revenue */}
      <div className={cn('grid gap-5', showRevenue && 'lg:grid-cols-2')}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass-luxury rounded-2xl p-4 sm:rounded-3xl sm:p-7"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-light/50">Pipeline</p>
              <h2 className="mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">Воронка сделок</h2>
            </div>
            <Link href="/admin/leads" className="btn-quiet">Открыть</Link>
          </div>
          <div className="space-y-3">
            {pipeline.map((p) => (
              <div key={p.stage}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className={cn('rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]', dealStageAccent(p.stage))}>
                    {dealStageLabel(p.stage)}
                  </span>
                  <span className="text-muted">{p.count} · {formatMoney(p.sum)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-lime-gradient" style={{ width: `${(p.count / maxPipeline) * 100}%` }} />
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

      {/* Tasks + renewals */}
      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.36 }}
          className="glass-luxury rounded-2xl p-4 sm:rounded-3xl sm:p-7"
        >
          <h2 className="mb-4 font-display text-xl font-extrabold text-light sm:text-2xl">Задачи</h2>
          <div className="space-y-2">
            {tasks.map((t) => {
              const over = isOverdue(t.dueDate);
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-light">{t.title}</div>
                    {t.context && <div className="truncate text-[11px] text-light/45">{t.context}</div>}
                  </div>
                  {t.dueDate && (
                    <span className={cn('shrink-0 text-[11px]', over ? 'text-rose-400' : 'text-light/50')}>
                      {over ? 'просрочено · ' : 'до '}{formatDate(t.dueDate)}
                    </span>
                  )}
                </div>
              );
            })}
            {!tasks.length && <p className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-8 text-center text-sm text-light/55">Открытых задач нет 🎉</p>}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.42 }}
          className="glass-luxury rounded-2xl p-4 sm:rounded-3xl sm:p-7"
        >
          <h2 className="mb-4 font-display text-xl font-extrabold text-light sm:text-2xl">Продление тарифов</h2>
          <div className="space-y-2">
            {renewals.map((r) => (
              <div key={r.businessName} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <span className="truncate text-sm font-medium text-light">{r.businessName}</span>
                <span className={cn('shrink-0 text-[11px]', r.daysLeft < 0 ? 'text-rose-400' : r.daysLeft <= 7 ? 'text-brand-orange' : 'text-light/50')}>
                  {r.daysLeft < 0 ? `просрочено ${-r.daysLeft} дн.` : r.daysLeft === 0 ? 'сегодня' : `через ${r.daysLeft} дн.`}
                </span>
              </div>
            ))}
            {!renewals.length && <p className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-8 text-center text-sm text-light/55">Ближайших продлений нет.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
