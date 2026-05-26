'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatInt, formatMoney, formatPct } from '@/lib/utils';

export function AdminDashboardClient({
  me,
  stats,
  monthly,
  forecast,
  recentLeads,
}: {
  me: string;
  stats: { totalClients: number; activeCampaigns: number; totalBudget: number; avgRomi: number };
  monthly: { month: string; helped: number }[];
  forecast: { date: string; profit: number }[];
  recentLeads: { id: string; name: string; email: string; message: string; status: string; createdAt: string }[];
}) {
  const monthlyData = monthly.map((m) => ({
    label: format(parse(m.month, 'yyyy-MM', new Date()), 'LLL', { locale: ru }),
    helped: m.helped,
  }));
  const forecastData = forecast.map((p) => ({
    label: format(new Date(p.date), 'd MMM', { locale: ru }),
    profit: Math.round(p.profit),
  }));

  const tooltipStyle = {
    background: 'rgba(10,7,18,0.95)',
    border: '1px solid rgba(212,236,76,0.3)',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 12,
    boxShadow: '0 30px 60px -20px rgba(0,0,0,0.7)',
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Cabin"
        title={
          <>
            С возвращением, <span className="text-lime-grad">{me.split(' ')[0]}</span>
          </>
        }
        subtitle="Всё, что вы хотели знать о бизнесе — в одном экране."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Всего клиентов" value={formatInt(stats.totalClients)} delay={0} icon={<span className="text-sm">◷</span>} />
        <KpiCard label="Активные кампании" value={formatInt(stats.activeCampaigns)} delay={0.05} icon={<span className="text-sm">◐</span>} />
        <KpiCard label="Общий бюджет" value={formatMoney(stats.totalBudget)} delay={0.1} icon={<span className="text-sm">$</span>} />
        <KpiCard label="Средний ROMI" value={formatPct(stats.avgRomi, true)} delay={0.15} icon={<span className="text-sm">↗</span>} />
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass-luxury rounded-3xl p-7"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-light/50">Прогноз прибыли</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-light">Forecast 6 недель</h2>
            </div>
            <span className="chip-lime">live</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4EC4C" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#5B3CA3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(245,241,250,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: 'rgba(245,241,250,0.5)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: '#D4EC4C' }}
                  formatter={(v: number) => [formatMoney(v), 'Прибыль']}
                />
                <Area type="monotone" dataKey="profit" stroke="#D4EC4C" strokeWidth={2.5} fill="url(#profitFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="glass-luxury rounded-3xl p-7"
        >
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.24em] text-light/50">Помогли клиентам</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-light">На сопровождении</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E4F47A" />
                    <stop offset="100%" stopColor="#A8BD2F" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(245,241,250,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(245,241,250,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(212,236,76,0.05)' }}
                  labelStyle={{ color: '#D4EC4C' }}
                />
                <Bar dataKey="helped" fill="url(#barFill)" radius={[8, 8, 0, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent contact requests */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="glass-luxury rounded-3xl p-7"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-light/50">Последние</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-light">Свежие заявки</h2>
          </div>
          <Link href="/admin/leads" className="btn-quiet">Все заявки</Link>
        </div>
        <div className="space-y-2">
          {recentLeads.map((l) => (
            <div
              key={l.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 transition-colors hover:border-brand-lime/20 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="font-medium text-light">{l.name}</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-light/45">{l.email}</div>
                {l.message && <div className="mt-2 line-clamp-1 text-sm text-light/70">{l.message}</div>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-light/45">{format(new Date(l.createdAt), 'd MMM', { locale: ru })}</span>
                <StatusPill status={l.status} />
              </div>
            </div>
          ))}
          {!recentLeads.length && (
            <p className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-8 text-center text-sm text-light/55">
              Заявок пока нет — отправьте трафик на главную.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
