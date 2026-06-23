'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ReachChart } from '@/components/dashboard/ReachChart';
import { BudgetBar } from '@/components/dashboard/BudgetBar';
import { PlatformRow } from '@/components/dashboard/PlatformRow';
import { CampaignList } from '@/components/dashboard/CampaignList';
import { AudienceChart, type AudienceData } from '@/components/dashboard/AudienceChart';
import { formatInt, formatMoney, monthLabel, tariffLabel } from '@/lib/utils';

type Metrics = {
  spent: number;
  reach: number;
  clicks: number;
  leads: number;
  budget: number;
  spentDelta: number | null;
  reachDelta: number | null;
  clicksDelta: number | null;
  leadsDelta: number | null;
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
}: {
  user: { name: string; tariff: string; tariffEnd: string | null };
  business: { name: string; niche: string };
  period: { month: number; year: number } | null;
  metrics: Metrics;
  reachTrend: { label: string; reach: number }[];
  platforms: { name: string; spent: number; roas: number }[];
  campaigns: { id: string; name: string; platform: string; status: string }[];
  audience: AudienceData | null;
}) {
  const hasData = period !== null;

  return (
    <main className="mx-auto max-w-7xl px-5 pb-20 pt-6">
      {/* Greeting + tariff */}
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
        <div className="glass-gold flex items-center justify-between gap-6 rounded-2xl px-5 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted">Тариф</div>
            <div className="font-display text-lg font-bold text-lime-grad">{tariffLabel(user.tariff)}</div>
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

      {!hasData ? (
        <div className="glass mt-10 rounded-3xl p-12 text-center">
          <h2 className="font-display text-2xl font-bold text-light">Данные готовятся</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            Первый отчёт появится здесь, как только команда mimi заполнит результаты за месяц.
          </p>
        </div>
      ) : (
        <>
          {/* KPI ROW */}
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="Потрачено" value={formatMoney(metrics.spent)} delta={metrics.spentDelta} delay={0} />
            <MetricCard label="Охват" value={formatInt(metrics.reach)} delta={metrics.reachDelta} delay={0.08} />
            <MetricCard label="Клики" value={formatInt(metrics.clicks)} delta={metrics.clicksDelta} delay={0.16} />
            <MetricCard label="Заявки" value={formatInt(metrics.leads)} delta={metrics.leadsDelta} delay={0.24} />
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
