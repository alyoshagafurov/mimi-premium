'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/admin/PageHeader';
import { formatInt, formatMoney, cn, MONTHS_RU } from '@/lib/utils';

type Props = {
  total: number;
  invoices: number;
  payers: number;
  byYear: { year: number; amount: number }[];
  byMonth: Record<number, number[]>;
  byWeek: { start: string; amount: number }[];
  topClients: { id: string; name: string; amount: number }[];
  currentYear: number;
  currentMonthAmount: number;
  prevMonthAmount: number;
};

const M_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

/** Точка на окружности; 0° — сверху. */
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** Кольцевой сектор — «лепесток» месяца. */
function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0} A${r1} ${r1} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${big} 0 ${x3} ${y3} Z`;
}

/** Сглаженная ломаная (Catmull-Rom → кубические Безье). */
function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]} ${pts[0][1]}` : '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function Panel({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={cn('rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7', className)}
    >
      {children}
    </motion.section>
  );
}

export function FinanceClient({
  total, invoices, payers, byYear, byMonth, byWeek, topClients,
  currentYear, currentMonthAmount, prevMonthAmount,
}: Props) {
  // Суммы всегда закрыты при заходе — чтобы случайно не показать заработки
  // на презентации. Открывает только «глазик», и только до перезагрузки.
  const [reveal, setReveal] = useState(false);
  const stars = (n: number) => formatInt(n).replace(/\d/g, '*');
  const sum = (n: number) => (reveal ? formatInt(n) : stars(n));
  const sumFull = (n: number) => (reveal ? formatMoney(n) : `${stars(n)} сомони`);

  const yearsList = byYear.map((y) => y.year);
  const [year, setYear] = useState(yearsList.includes(currentYear) ? currentYear : yearsList[yearsList.length - 1] ?? currentYear);
  const [hoverM, setHoverM] = useState<number | null>(null);
  const [hoverW, setHoverW] = useState<number | null>(null);

  const months = byMonth[year] ?? Array(12).fill(0);
  const yearTotal = months.reduce((s, v) => s + v, 0);
  const maxMonth = Math.max(...months, 1);
  const bestMonth = months.indexOf(Math.max(...months));

  const maxYear = Math.max(...byYear.map((y) => y.amount), 1);
  const maxWeek = Math.max(...byWeek.map((w) => w.amount), 1);
  const weekSum = byWeek.reduce((s, w) => s + w.amount, 0);
  const lastWeek = byWeek[byWeek.length - 1]?.amount ?? 0;

  const momDelta = prevMonthAmount > 0
    ? Math.round(((currentMonthAmount - prevMonthAmount) / prevMonthAmount) * 100)
    : null;

  /* ── Геометрия годового кольца ── */
  const R = { cx: 170, cy: 170, in: 62, out: 152 };
  const petals = useMemo(
    () => months.map((v, i) => {
      const r1 = R.in + (v / maxMonth) * (R.out - R.in);
      return { i, v, d: sector(R.cx, R.cy, R.in, Math.max(r1, R.in + 2), i * 30 + 2.5, (i + 1) * 30 - 2.5) };
    }),
    [months, maxMonth, R.cx, R.cy, R.in, R.out],
  );

  /* ── Геометрия недельного графика ── */
  const W = { w: 900, h: 220, pad: 14 };
  const wpts = useMemo(
    () => byWeek.map((b, i) => [
      W.pad + (i * (W.w - W.pad * 2)) / Math.max(byWeek.length - 1, 1),
      W.h - 26 - (b.amount / maxWeek) * (W.h - 56),
    ] as [number, number]),
    [byWeek, maxWeek, W.h, W.pad, W.w],
  );
  const line = smooth(wpts);
  const area = wpts.length ? `${line} L${wpts[wpts.length - 1][0]} ${W.h} L${wpts[0][0]} ${W.h} Z` : '';

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        eyebrow="Finance"
        title={<>Финансы <span className="text-lime-grad">агентства</span></>}
        subtitle="Выручка за всё время, по годам, по месяцам и по неделям."
        action={
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-pressed={reveal}
            title={reveal ? 'Скрыть суммы' : 'Показать суммы'}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] transition',
              reveal
                ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime'
                : 'border-white/10 text-light/55 hover:border-brand-lime/40 hover:text-light',
            )}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {reveal ? (
                <>
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M4 4l16 16" />
                  <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.3 3.9M6.5 7.6A17 17 0 0 0 2 12s3.6 6 10 6a10 10 0 0 0 3.9-.75" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                </>
              )}
            </svg>
            {reveal ? 'Скрыть' : 'Показать'}
          </button>
        }
      />

      {/* ── Выручка за всё время ── */}
      <Panel className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-lime/[0.09] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-brand-purple/[0.22] blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Выручка за всё время</p>
            <div className="mt-3 font-display text-5xl font-extrabold leading-none text-lime-grad sm:text-7xl">
              {sum(total)}
            </div>
            <p className="mt-2 text-sm text-light/50">сомони · {formatInt(invoices)} оплат · {formatInt(payers)} плательщиков</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-light/45">Этот месяц</div>
              <div className="mt-2 font-display text-2xl font-extrabold text-light">{sum(currentMonthAmount)}</div>
              {momDelta !== null && (
                <div className={cn('mt-1 text-[11px]', momDelta >= 0 ? 'text-brand-lime' : 'text-rose-300')}>
                  {momDelta >= 0 ? '↑' : '↓'} {Math.abs(momDelta)}% к прошлому
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-light/45">Средний чек</div>
              <div className="mt-2 font-display text-2xl font-extrabold text-light">
                {invoices ? sum(total / invoices) : '—'}
              </div>
              <div className="mt-1 text-[11px] text-light/40">за оплату</div>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Год: кольцо месяцев ── */}
      <Panel delay={0.06}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Помесячно</p>
            <h2 className="mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">Круг года</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {yearsList.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 font-mono text-[12px] transition',
                  y === year
                    ? 'border-brand-lime/50 bg-brand-lime/10 text-brand-lime'
                    : 'border-white/10 text-light/50 hover:border-brand-lime/30 hover:text-light',
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:items-center">
          <div className="mx-auto w-full max-w-[340px]">
            <svg viewBox="0 0 340 340" className="w-full">
              <defs>
                <linearGradient id="petal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4EC4C" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#FF7A3D" stopOpacity="0.65" />
                </linearGradient>
              </defs>
              {/* направляющие кольца */}
              {[0.33, 0.66, 1].map((f) => (
                <circle key={f} cx={R.cx} cy={R.cy} r={R.in + f * (R.out - R.in)}
                  fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 5" />
              ))}
              {petals.map((p) => (
                <motion.path
                  key={p.i}
                  d={p.d}
                  fill="url(#petal)"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: hoverM === null || hoverM === p.i ? 1 : 0.28, scale: 1 }}
                  transition={{ duration: 0.45, delay: 0.05 + p.i * 0.03 }}
                  style={{ transformOrigin: `${R.cx}px ${R.cy}px`, cursor: 'pointer' }}
                  onMouseEnter={() => setHoverM(p.i)}
                  onMouseLeave={() => setHoverM(null)}
                />
              ))}
              {/* подписи месяцев */}
              {M_SHORT.map((m, i) => {
                const [x, y] = polar(R.cx, R.cy, R.out + 14, i * 30 + 15);
                return (
                  <text key={m} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                    className="fill-current" fontSize="9"
                    style={{ color: hoverM === i ? '#D4EC4C' : 'rgba(255,255,255,0.4)' }}>
                    {m}
                  </text>
                );
              })}
              {/* центр */}
              <circle cx={R.cx} cy={R.cy} r={R.in - 6} fill="rgba(255,255,255,0.03)" />
              <text x={R.cx} y={R.cy - 8} textAnchor="middle" fontSize="10"
                style={{ color: 'rgba(255,255,255,0.45)' }} className="fill-current uppercase">
                {hoverM === null ? String(year) : M_SHORT[hoverM]}
              </text>
              <text x={R.cx} y={R.cy + 14} textAnchor="middle" fontSize="17" fontWeight="800"
                style={{ color: '#D4EC4C' }} className="fill-current">
                {sum(hoverM === null ? yearTotal : months[hoverM])}
              </text>
            </svg>
          </div>

          {/* список месяцев рядом с кольцом */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {months.map((v, i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHoverM(i)}
                onMouseLeave={() => setHoverM(null)}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition',
                  hoverM === i ? 'bg-brand-lime/[0.08]' : 'hover:bg-white/[0.03]',
                )}
              >
                <span className={cn('text-[12px]', i === bestMonth && v > 0 ? 'text-brand-lime' : 'text-light/55')}>
                  {MONTHS_RU[i]}
                </span>
                <span className="font-mono text-[12px] text-light/80">{v ? sum(v) : '—'}</span>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* ── По неделям ── */}
      <Panel delay={0.12}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Понедельно</p>
            <h2 className="mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">Последние 26 недель</h2>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-extrabold text-light">{sumFull(weekSum)}</div>
            <div className="text-[11px] text-light/45">на этой неделе {sum(lastWeek)}</div>
          </div>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${W.w} ${W.h}`} className="w-full" preserveAspectRatio="none" style={{ height: 220 }}>
            <defs>
              <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4EC4C" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#D4EC4C" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#wfill)" />
            <motion.path
              d={line}
              fill="none"
              stroke="#D4EC4C"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              vectorEffect="non-scaling-stroke"
            />
            {wpts.map(([x, y], i) => (
              <g key={i} onMouseEnter={() => setHoverW(i)} onMouseLeave={() => setHoverW(null)}>
                <rect x={x - 16} y={0} width={32} height={W.h} fill="transparent" style={{ cursor: 'pointer' }} />
                <circle cx={x} cy={y} r={hoverW === i ? 5 : 2.5}
                  fill={hoverW === i ? '#FF7A3D' : '#D4EC4C'} opacity={byWeek[i].amount ? 1 : 0.25} />
              </g>
            ))}
          </svg>
          {hoverW !== null && (
            <div className="pointer-events-none absolute -top-1 left-0 right-0 flex justify-center">
              <span className="rounded-full border border-brand-lime/30 bg-ink/90 px-3 py-1 text-[11px] text-light">
                {new Date(byWeek[hoverW].start).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                {' · '}
                <span className="font-mono text-brand-lime">{sum(byWeek[hoverW].amount)}</span>
              </span>
            </div>
          )}
          <div className="mt-1 flex justify-between font-mono text-[10px] text-light/30">
            <span>{new Date(byWeek[0]?.start ?? Date.now()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
            <span>сегодня</span>
          </div>
        </div>
      </Panel>

      {/* ── По годам + топ плательщиков ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel delay={0.18}>
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Погодично</p>
          <h2 className="mb-6 mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">Год к году</h2>
          {byYear.length === 0 ? (
            <p className="py-8 text-center text-sm text-light/40">Пока нет оплат.</p>
          ) : (
            <div className="space-y-4">
              {byYear.map((y, i) => {
                const prev = byYear[i - 1]?.amount;
                const growth = prev ? Math.round(((y.amount - prev) / prev) * 100) : null;
                return (
                  <div key={y.year}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="font-mono text-sm text-light/70">{y.year}</span>
                      <span className="flex items-baseline gap-2">
                        {growth !== null && (
                          <span className={cn('text-[11px]', growth >= 0 ? 'text-brand-lime' : 'text-rose-300')}>
                            {growth >= 0 ? '+' : ''}{growth}%
                          </span>
                        )}
                        <span className="font-mono text-sm text-light">{sum(y.amount)}</span>
                      </span>
                    </div>
                    {/* «плитки» вместо обычной полосы */}
                    <div className="flex h-6 gap-[3px] overflow-hidden rounded-lg">
                      {Array.from({ length: 28 }, (_, k) => {
                        const filled = k < Math.round((y.amount / maxYear) * 28);
                        return (
                          <motion.span
                            key={k}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 + i * 0.08 + k * 0.012 }}
                            className={cn(
                              'h-full flex-1 rounded-[3px]',
                              filled ? 'bg-gradient-to-b from-brand-lime/90 to-brand-lime/50' : 'bg-white/[0.05]',
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel delay={0.24}>
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Кто платит</p>
          <h2 className="mb-6 mt-1.5 font-display text-xl font-extrabold text-light sm:text-2xl">Топ плательщиков</h2>
          {topClients.length === 0 ? (
            <p className="py-8 text-center text-sm text-light/40">Пока нет оплат.</p>
          ) : (
            <div className="space-y-3.5">
              {topClients.map((c, i) => {
                const share = total ? (c.amount / total) * 100 : 0;
                return (
                  <Link key={c.id} href={`/admin/clients/${c.id}`} className="group block">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-[13px] text-light/85 group-hover:text-brand-lime">
                        {i + 1}. {c.name}
                      </span>
                      <span className="shrink-0 font-mono text-[12px] text-light/60">
                        {sum(c.amount)} · {share.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${share}%` }}
                        transition={{ duration: 0.8, delay: 0.28 + i * 0.05 }}
                        className="h-full rounded-full bg-gradient-to-r from-brand-lime to-brand-orange/70"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
