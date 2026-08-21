'use client';

import { motion } from 'framer-motion';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ReachChart } from '@/components/dashboard/ReachChart';
import { BudgetBar } from '@/components/dashboard/BudgetBar';
import { PlatformRow } from '@/components/dashboard/PlatformRow';
import { CampaignList } from '@/components/dashboard/CampaignList';
import { AudienceChart, type AudienceData } from '@/components/dashboard/AudienceChart';
import { ClientOverview, type ReportRow, type NoteRow, type TaskRow } from './ClientOverview';
import { formatInt, formatMoney, formatPct, formatRoas, monthLabel, reportKpis } from '@/lib/utils';

type Metrics = {
  spent: number;
  reach: number;
  clicks: number;
  leads: number;
  budget: number;
  revenue: number;
  profileVisits: number;
  campaignCount: number;
  spentDelta: number | null;
  reachDelta: number | null;
  clicksDelta: number | null;
  leadsDelta: number | null;
  revenueDelta: number | null;
};

export function DashboardClient({
  user,
  business,
  period,
  metrics,
  reachTrend,
  platforms,
  campaigns,
  audience,
  reportList,
  notes,
  tasks,
}: {
  user: { name: string; tariff: string; tariffEnd: string | null };
  business: { name: string; niche: string; logo: string | null; since: string };
  period: { month: number; year: number } | null;
  metrics: Metrics;
  reachTrend: { label: string; reach: number }[];
  platforms: { name: string; spent: number; roas: number }[];
  campaigns: { id: string; name: string; platform: string; status: string }[];
  audience: AudienceData | null;
  reportList: ReportRow[];
  notes: NoteRow[];
  tasks: TaskRow[];
}) {
  const hasData = period !== null;
  const k = reportKpis({ spent: metrics.spent, revenue: metrics.revenue, leads: metrics.leads, clicks: metrics.clicks });

  return (
    <main className="mx-auto max-w-7xl px-5 pb-20 pt-6">
      {/* Приветствие */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            {hasData ? `Отчёт за ${monthLabel(period!.month, period!.year)}` : 'Командный центр'}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight md:text-4xl">
            Здравствуйте, <span className="text-lime-grad">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {business.name} · {business.niche}
          </p>
        </div>
      </motion.div>

      <div className="mt-7">
        <ClientOverview
          business={business}
          tariff={user.tariff}
          tariffEnd={user.tariffEnd}
          period={period}
          roas={k.roas}
          romi={k.romi}
          payback={k.payback}
          revenue={metrics.revenue}
          spent={metrics.spent}
          leads={metrics.leads}
          reportList={reportList}
          notes={notes}
          tasks={tasks}
        />
      </div>

      {!hasData ? (
        <div className="glass mt-10 rounded-3xl p-12 text-center">
          <h2 className="font-display text-2xl font-bold text-light">Данные готовятся</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            Первый отчёт появится здесь, как только команда mimi заполнит результаты за месяц.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10">
            <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Аналитика</p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold text-light">Подробные цифры</h2>
          </div>

          {/* KPI ROW — reach funnel */}
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="Потрачено" value={formatMoney(metrics.spent)} delta={metrics.spentDelta} delay={0} />
            <MetricCard label="Охват" value={formatInt(metrics.reach)} delta={metrics.reachDelta} delay={0.08} />
            <MetricCard label="Клики" value={formatInt(metrics.clicks)} delta={metrics.clicksDelta} delay={0.16} />
            <MetricCard label="Заявки" value={formatInt(metrics.leads)} delta={metrics.leadsDelta} delay={0.24} />
          </div>

          {/* KPI ROW — revenue + unit economics */}
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="Выручка" value={formatMoney(metrics.revenue)} delta={metrics.revenueDelta} delay={0} />
            <MetricCard label="CPL — цена заявки" value={formatMoney(k.cpl)} delta={null} delay={0.08} />
            <MetricCard label="CPC — цена клика" value={formatMoney(k.cpc)} delta={null} delay={0.16} />
            <MetricCard label="Переходы в профиль" value={formatInt(metrics.profileVisits)} delta={null} delay={0.24} />
          </div>

          {/* ANALYTICS — marketing payback */}
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="ROAS" value={formatRoas(k.roas)} delta={null} delay={0} />
            <MetricCard label="ROMI" value={formatPct(k.romi, true)} delta={null} delay={0.08} />
            <MetricCard label="Окупаемость маркетинга" value={`${Math.round(k.payback)}%`} delta={null} delay={0.16} />
            <MetricCard label="Рекламных кампаний" value={formatInt(metrics.campaignCount)} delta={null} delay={0.24} />
          </div>

          {/* CHART + BUDGET */}
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold">Динамика охвата</h2>
                  <p className="text-xs text-muted">Охват по месяцам</p>
                </div>
                <span className="chip-lime">Live</span>
              </div>
              <ReachChart data={reachTrend} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28 }}
              className="glass flex flex-col justify-center rounded-2xl p-6"
            >
              <BudgetBar spent={metrics.spent} budget={metrics.budget} />
            </motion.div>
          </div>

          {/* PLATFORMS + AUDIENCE */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.34 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="mb-4 font-display text-lg font-bold">Платформы</h2>
              <div className="space-y-3">
                {platforms.length ? (
                  platforms.map((p, i) => (
                    <PlatformRow key={p.name} name={p.name} spent={p.spent} roas={p.roas} index={i} />
                  ))
                ) : (
                  <p className="text-sm text-muted">Разбивка по платформам появится в следующем отчёте.</p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="font-display text-lg font-bold">Аудитория по возрасту</h2>
              <p className="mb-4 text-xs text-muted">Распределение охвата</p>
              {audience ? (
                <AudienceChart data={audience} />
              ) : (
                <p className="text-sm text-muted">Данные по аудитории ещё не заполнены.</p>
              )}
            </motion.div>
          </div>

          {/* CAMPAIGNS */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.46 }}
            className="glass mt-6 rounded-2xl p-6"
          >
            <h2 className="mb-4 font-display text-lg font-bold">Активные кампании</h2>
            <CampaignList campaigns={campaigns} />
          </motion.div>
        </>
      )}
    </main>
  );
}
