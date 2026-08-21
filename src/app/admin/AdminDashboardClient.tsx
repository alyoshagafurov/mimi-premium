'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/admin/PageHeader';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { SALES_STATUS_LABEL, type SalesStatus } from '@/lib/roles';
import { formatInt, formatMoney, cn } from '@/lib/utils';

type Stats = {
  activeProjects: number; staffCount: number; activeTasks: number;
  activeEvents: number; doneEvents: number; leadsTotal: number;
};
type Crm = { status: string; count: number }[];
type Production = { cat: 'VIDEO' | 'MONTAGE' | 'DESIGN'; total: number; done: number }[];
type Funnel = { status: string; reached: number; pct: number }[];

/** Как называем направления на дашборде — короче, чем в календаре. */
const PROD_LABEL: Record<Production[number]['cat'], string> = {
  VIDEO: 'Reels / съёмка',
  MONTAGE: 'Монтаж',
  DESIGN: 'Дизайн',
};
type Ranked = { id: string; name: string; logo: string | null }[];
type RevRow = { id: string; name: string; logo: string | null; revenue: number };
type TenRow = { id: string; name: string; logo: string | null; days: number };
type DebtRow = { id: string; name: string; logo: string | null; amount: number; overdue: number; nextDue: string | null };

/** «2 г 3 мес», «5 мес», «12 дн» */
function tenure(days: number): string {
  if (days >= 365) {
    const y = Math.floor(days / 365);
    const m = Math.floor((days % 365) / 30);
    return `${y} г${m ? ` ${m} мес` : ''}`;
  }
  if (days >= 30) return `${Math.floor(days / 30)} мес`;
  return `${days} дн`;
}

/** Логотип проекта или буква названия. */
function Mark({ name, logo, size = 34 }: { name: string; logo: string | null; size?: number }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt="" className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />;
  }
  return <UserAvatar name={name} avatar={null} size={size} />;
}

/** Плитка-счётчик; если задан href — вся плитка кликабельна. */
function Tile({
  label, value, hint, href, accent, delay = 0,
}: {
  label: string; value: string; hint?: string; href?: string; accent?: boolean; delay?: number;
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'group relative h-full overflow-hidden rounded-3xl border p-5 transition-colors sm:p-6',
        accent
          ? 'border-brand-lime/25 bg-brand-lime/[0.05] hover:border-brand-lime/50'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-brand-lime/30',
      )}
    >
      {/* мягкое свечение в углу — статичное, без нагрузки на прокрутку */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-lime/[0.07] blur-2xl" />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-[0.22em] text-light/45">{label}</div>
        <div className={cn('mt-3 font-display text-4xl font-extrabold leading-none sm:text-5xl',
          accent ? 'text-lime-grad' : 'text-light')}>
          {value}
        </div>
        {hint && <div className="mt-2 text-[11px] text-light/40">{hint}</div>}
        {href && (
          <div className="mt-3 text-[10px] uppercase tracking-[0.16em] text-brand-lime/0 transition group-hover:text-brand-lime/80">
            открыть →
          </div>
        )}
      </div>
    </motion.div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

/** Кольцо прогресса — доля выполненного по направлению. */
function Ring({ pct, label, done, total, delay }: { pct: number; label: string; done: number; total: number; delay: number }) {
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <svg width="86" height="86" viewBox="0 0 86 86" className="shrink-0 -rotate-90">
        <circle cx="43" cy="43" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="43" cy="43" r={R} fill="none" stroke="#D4EC4C" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (pct / 100) * C }}
          transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
        <text x="43" y="43" textAnchor="middle" dominantBaseline="central" transform="rotate(90 43 43)"
          fontSize="16" fontWeight="800" style={{ color: '#D4EC4C' }} className="fill-current">
          {pct}%
        </text>
      </svg>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-light">{label}</div>
        <div className="mt-1 font-mono text-[12px] text-light/50">{done} из {total}</div>
        <div className="text-[11px] text-light/35">{total - done} в работе</div>
      </div>
    </div>
  );
}

export function AdminDashboardClient({
  me, stats, crm, topRevenue, topTenure, owing, production, funnel, totalConversion,
}: {
  me: string; stats: Stats; crm: Crm;
  topRevenue: RevRow[]; topTenure: TenRow[]; owing: DebtRow[];
  production: Production; funnel: Funnel; totalConversion: number;
}) {
  const maxCrm = Math.max(...crm.map((c) => c.count), 1);
  const maxRev = Math.max(...topRevenue.map((c) => c.revenue), 1);
  const maxDays = Math.max(...topTenure.map((c) => c.days), 1);
  const owedTotal = owing.reduce((s, o) => s + o.amount, 0);
  const overdueTotal = owing.reduce((s, o) => s + o.overdue, 0);

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        eyebrow="Cabin"
        title={<>С возвращением, <span className="text-lime-grad">{me.split(' ')[0]}</span></>}
        subtitle="Проекты, команда, задачи и воронка — в одном экране."
      />

      {/* ── Счётчики ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Tile
          label="Активные проекты"
          value={formatInt(stats.activeProjects)}
          hint="партнёры, с которыми работаем"
          href="/admin/clients"
          accent
          delay={0}
        />
        <Tile
          label="Сотрудники"
          value={formatInt(stats.staffCount)}
          hint="в команде"
          href="/admin/people"
          delay={0.06}
        />
        <Tile
          label="Активные задачи"
          value={formatInt(stats.activeTasks)}
          hint="в работе"
          href="/admin/tasks"
          delay={0.12}
        />
        <Tile
          label="Активные события"
          value={formatInt(stats.activeEvents)}
          hint="в календаре"
          href="/admin/calendar"
          delay={0.18}
        />
        <Tile
          label="Выполненные события"
          value={formatInt(stats.doneEvents)}
          hint="закрыто"
          href="/admin/tasks"
          delay={0.24}
        />
      </div>

      {/* ── Производство: reels / монтаж / дизайн ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.14 }}
        className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7"
      >
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Производство</p>
          <h2 className="mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">По направлениям</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {production.map((p, i) => (
            <Ring
              key={p.cat}
              label={PROD_LABEL[p.cat]}
              done={p.done}
              total={p.total}
              pct={p.total ? Math.round((p.done / p.total) * 100) : 0}
              delay={0.2 + i * 0.1}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Воронка CRM: горизонтальные ступени ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.16 }}
        className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">CRM</p>
            <h2 className="mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">Быстрая статистика</h2>
          </div>
          <Link href="/admin/sales" className="text-[11px] uppercase tracking-[0.16em] text-light/45 hover:text-brand-lime">
            вся воронка →
          </Link>
        </div>

        {/* Ступени воронки: ширина = доля от самого крупного этапа */}
        <div className="space-y-2.5">
          {crm.map((c, i) => {
            const pct = (c.count / maxCrm) * 100;
            return (
              <div key={c.status} className="group flex items-center gap-4">
                <span className="w-44 shrink-0 truncate text-[12px] text-light/60">
                  {SALES_STATUS_LABEL[c.status as SalesStatus]}
                </span>
                <div className="relative h-8 flex-1 overflow-hidden rounded-xl bg-white/[0.04]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, c.count ? 6 : 0)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-xl bg-gradient-to-r from-brand-lime/70 to-brand-orange/60"
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center font-mono text-[12px] font-bold text-[#0A0712] mix-blend-luminosity">
                    {c.count || ''}
                  </span>
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-[12px] text-light/45">{c.count}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Конверсия воронки ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Конверсия</p>
            <h2 className="mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">Из лида в партнёра</h2>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl font-extrabold leading-none text-lime-grad">{totalConversion}%</div>
            <div className="mt-1 text-[11px] text-light/40">доходят до партнёрства</div>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-2">
          {funnel.map((f, i) => (
            <Fragment key={f.status}>
              {i > 0 && (
                <div className="flex shrink-0 flex-col items-center justify-center px-0.5">
                  <span
                    className={cn(
                      'font-mono text-[12px] font-bold',
                      f.pct >= 50 ? 'text-brand-lime' : f.pct >= 25 ? 'text-brand-orange' : 'text-rose-300',
                    )}
                  >
                    {f.pct}%
                  </span>
                  <span className="text-[13px] text-light/20">→</span>
                </div>
              )}
              <div className="min-w-[104px] flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="truncate text-[10px] uppercase tracking-[0.12em] text-light/45">
                  {SALES_STATUS_LABEL[f.status as SalesStatus]}
                </div>
                <div className="mt-2 font-display text-2xl font-extrabold text-light">{formatInt(f.reached)}</div>
                <div className="text-[10px] text-light/30">дошли</div>
              </div>
            </Fragment>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-light/35">
          «Дошли» — те, кто сейчас на этапе или прошёл его дальше. Процент — переход с предыдущего этапа.
        </p>
      </motion.div>

      {/* ── Два топа рядом ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Топ по прибыли */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6"
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Топ-10</p>
          <h2 className="mb-5 mt-1.5 font-display text-lg font-extrabold text-light sm:text-xl">
            Принесли больше всего
          </h2>
          {topRevenue.length === 0 ? (
            <p className="py-8 text-center text-sm text-light/40">Пока нет оплат.</p>
          ) : (
            <div className="space-y-3">
              {topRevenue.map((c, i) => (
                <Link key={c.id} href={`/admin/clients/${c.id}`} className="group block">
                  <div className="flex items-center gap-3">
                    <span className="w-5 shrink-0 font-mono text-[11px] text-light/25">{i + 1}</span>
                    <Mark name={c.name} logo={c.logo} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-light/85 group-hover:text-brand-lime">
                      {c.name}
                    </span>
                    <span className="shrink-0 font-mono text-[12px] text-brand-lime">{formatMoney(c.revenue)}</span>
                  </div>
                  {/* доля от лидера — сразу видно разрыв */}
                  <div className="ml-8 mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.revenue / maxRev) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.25 + i * 0.04 }}
                      className="h-full rounded-full bg-brand-lime/70"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Топ по сроку */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6"
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Топ-10</p>
          <h2 className="mb-5 mt-1.5 font-display text-lg font-extrabold text-light sm:text-xl">
            Дольше всех с нами
          </h2>
          {topTenure.length === 0 ? (
            <p className="py-8 text-center text-sm text-light/40">Пока нет проектов.</p>
          ) : (
            <div className="space-y-3">
              {topTenure.map((c, i) => (
                <Link key={c.id} href={`/admin/clients/${c.id}`} className="group block">
                  <div className="flex items-center gap-3">
                    <span className="w-5 shrink-0 font-mono text-[11px] text-light/25">{i + 1}</span>
                    <Mark name={c.name} logo={c.logo} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-light/85 group-hover:text-brand-lime">
                      {c.name}
                    </span>
                    <span className="shrink-0 font-mono text-[12px] text-brand-orange">{tenure(c.days)}</span>
                  </div>
                  <div className="ml-8 mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.days / maxDays) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.3 + i * 0.04 }}
                      className="h-full rounded-full bg-brand-orange/60"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Долги ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.34 }}
        className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Дебиторка</p>
            <h2 className="mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">Нам должны</h2>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-extrabold text-light">{formatMoney(owedTotal)}</div>
            {overdueTotal > 0 && (
              <div className="text-[11px] text-rose-300">просрочено {formatMoney(overdueTotal)}</div>
            )}
          </div>
        </div>

        {owing.length === 0 ? (
          <p className="py-8 text-center text-sm text-light/40">Долгов нет — все счета закрыты.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-[10px] uppercase tracking-[0.16em] text-light/40">
                <tr>
                  <th className="pb-3 text-left">Проект</th>
                  <th className="pb-3 text-right">Должен</th>
                  <th className="pb-3 text-right">Из них просрочено</th>
                  <th className="pb-3 text-right">Ближайший срок</th>
                </tr>
              </thead>
              <tbody>
                {owing.map((o) => (
                  <tr key={o.id} className="border-t border-white/5">
                    <td className="py-3">
                      <Link href={`/admin/clients/${o.id}`} className="group flex items-center gap-3">
                        <Mark name={o.name} logo={o.logo} size={30} />
                        <span className="truncate text-light/85 group-hover:text-brand-lime">{o.name}</span>
                      </Link>
                    </td>
                    <td className="py-3 text-right font-mono text-light">{formatMoney(o.amount)}</td>
                    <td className="py-3 text-right font-mono">
                      {o.overdue > 0
                        ? <span className="text-rose-300">{formatMoney(o.overdue)}</span>
                        : <span className="text-light/25">—</span>}
                    </td>
                    <td className="py-3 text-right text-[12px] text-light/50">
                      {o.nextDue ? new Date(o.nextDue).toLocaleDateString('ru-RU') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
