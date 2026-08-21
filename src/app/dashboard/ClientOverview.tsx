'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn, formatInt, formatMoney, monthLabel, tariffLabel } from '@/lib/utils';

export type ReportRow = { id: string; month: number; year: number; revenue: number; spent: number; leads: number };
export type NoteRow = { id: string; body: string; createdAt: string; authorName: string; authorAvatar: string | null };
export type TaskRow = { id: string; title: string; kind: string; date: string; done: boolean; doneAt: string | null };

const KIND_LABEL: Record<string, string> = {
  MEETING: 'Встреча', CALL: 'Созвон', CONSULTATION: 'Консультация', PAYMENT: 'Оплата',
  COLLABORATION: 'Коллаборация', SHOOTING: 'Съёмка', LAUNCH: 'Запуск',
  RETARGETING: 'Ретаргет', DEADLINE: 'Дедлайн', TASK: 'Задача', OTHER: 'Событие',
};

const DAY = 86_400_000;
const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

/** «2 года 3 месяца», «7 месяцев», «12 дней» — тем, кто с нами давно, приятно. */
function together(sinceIso: string): { big: string; small: string } {
  const days = Math.max(0, Math.floor((Date.now() - new Date(sinceIso).getTime()) / DAY));
  const months = Math.floor(days / 30.4);
  if (months >= 12) {
    const y = Math.floor(months / 12);
    const m = months % 12;
    const yWord = y === 1 ? 'год' : y < 5 ? 'года' : 'лет';
    return { big: `${y} ${yWord}${m ? ` ${m} мес` : ''}`, small: `${formatInt(days)} дней вместе` };
  }
  if (months >= 1) return { big: `${months} мес`, small: `${formatInt(days)} дней вместе` };
  return { big: `${days} дн`, small: 'только начали' };
}

/** Цифра «набегает» от нуля — маленькая радость при каждом заходе. */
function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / ms, 1);
      // easeOutExpo — быстро разгоняется, мягко останавливается
      setV(target * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, ms]);
  return v;
}

function Counter({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const v = useCountUp(value);
  return <>{decimals ? v.toFixed(decimals) : formatInt(v)}{suffix}</>;
}

export function ClientOverview({
  business, tariff, tariffEnd, period, roas, romi, payback, revenue, spent, leads,
  reportList, notes, tasks,
}: {
  business: { name: string; niche: string; logo: string | null; since: string };
  tariff: string;
  tariffEnd: string | null;
  period: { month: number; year: number } | null;
  roas: number; romi: number; payback: number;
  revenue: number; spent: number; leads: number;
  reportList: ReportRow[];
  notes: NoteRow[];
  tasks: TaskRow[];
}) {
  const t = together(business.since);
  const daysLeft = tariffEnd ? Math.ceil((new Date(tariffEnd).getTime() - Date.now()) / DAY) : null;
  const openTasks = tasks.filter((x) => !x.done);
  const doneTasks = tasks.filter((x) => x.done);
  // Ширина полос «потрачено / заработано» — сразу видно разрыв.
  const maxBar = Math.max(revenue, spent, 1);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── Результат: главная цифра кабинета ── */}
      {revenue > 0 && spent > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-brand-lime/25 bg-gradient-to-br from-brand-lime/[0.07] via-transparent to-brand-purple/[0.18] p-6 sm:p-9"
        >
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand-lime/[0.12] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-brand-purple/[0.28] blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">
                {period ? `Результат за ${monthLabel(period.month, period.year)}` : 'Ваш результат'}
              </p>
              <p className="mt-4 text-sm text-light/60 sm:text-base">На каждый вложенный сомони вы получили</p>
              <div className="mt-1 flex items-end gap-3">
                <span className="font-display text-6xl font-extrabold leading-[0.9] text-lime-grad sm:text-8xl">
                  <Counter value={roas} decimals={1} />
                </span>
                <span className="pb-2 font-display text-2xl font-bold text-light/70 sm:pb-3 sm:text-3xl">сомони</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-brand-lime/30 bg-brand-lime/[0.07] px-4 py-2 text-[12px] text-brand-lime">
                  ROMI <span className="font-mono font-bold">{romi >= 0 ? '+' : ''}<Counter value={Math.round(romi)} />%</span>
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] text-light/70">
                  Окупаемость <span className="font-mono font-bold text-light"><Counter value={Math.round(payback)} />%</span>
                </span>
                {leads > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] text-light/70">
                    Заявок <span className="font-mono font-bold text-light"><Counter value={leads} /></span>
                  </span>
                )}
              </div>
            </div>

            {/* Вложили → заработали */}
            <div className="space-y-4">
              {[
                { label: 'Вложили в рекламу', value: spent, tone: 'bg-white/15', text: 'text-light/70' },
                { label: 'Заработали', value: revenue, tone: 'bg-gradient-to-r from-brand-lime to-brand-orange', text: 'text-light' },
              ].map((row, i) => (
                <div key={row.label}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-light/45">{row.label}</span>
                    <span className={cn('font-display text-lg font-extrabold sm:text-xl', row.text)}>
                      {formatMoney(row.value)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.value / maxBar) * 100}%` }}
                      transition={{ duration: 1.1, delay: 0.25 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className={cn('h-full rounded-full', row.tone)}
                    />
                  </div>
                </div>
              ))}
              {revenue > spent && (
                <p className="text-[12px] text-light/50">
                  Чистыми сверх вложений —{' '}
                  <span className="font-mono font-bold text-brand-lime">{formatMoney(revenue - spent)}</span>
                </p>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Сотрудничество и оплата ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.06 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Вместе</p>
          <div className="mt-3 font-display text-4xl font-extrabold leading-none text-lime-grad">{t.big}</div>
          <p className="mt-2 text-[12px] text-light/45">с {fmtDay(business.since)}</p>
          <p className="text-[11px] text-light/30">{t.small}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className={cn(
            'rounded-3xl border p-6',
            daysLeft !== null && daysLeft <= 7
              ? 'border-brand-orange/40 bg-brand-orange/[0.06]'
              : 'border-white/[0.06] bg-white/[0.02]',
          )}
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Оплата</p>
          {tariffEnd ? (
            <>
              <div className="mt-3 font-display text-4xl font-extrabold leading-none text-light">
                {daysLeft! > 0 ? <><Counter value={daysLeft!} /> дн</> : 'истекла'}
              </div>
              <p className="mt-2 text-[12px] text-light/45">
                {daysLeft! > 0 ? 'до' : 'закончилась'} {fmtDay(tariffEnd)}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, ((daysLeft ?? 0) / 30) * 100))}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={cn('h-full rounded-full', daysLeft! <= 7 ? 'bg-brand-orange' : 'bg-brand-lime')}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mt-3 font-display text-2xl font-extrabold leading-tight text-light/70">Бессрочно</div>
              <p className="mt-2 text-[12px] text-light/45">Дату уточните у менеджера</p>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Тариф</p>
          <div className="mt-3 font-display text-3xl font-extrabold leading-none text-light">{tariffLabel(tariff)}</div>
          <p className="mt-2 text-[12px] text-light/45">{business.name} · {business.niche}</p>
        </motion.div>
      </div>

      {/* ── Заметки от команды ── */}
      {notes.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7"
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">От команды mimi</p>
          <h2 className="mb-5 mt-1.5 font-display text-xl font-extrabold text-light">Что важно знать</h2>
          <div className="space-y-3">
            {notes.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.05 }}
                className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <UserAvatar name={n.authorName} avatar={n.authorAvatar} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[13px] font-medium text-light">{n.authorName}</span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-light/30">{fmtDay(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-light/75">{n.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Задачи по проекту ── */}
      {tasks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Работа над проектом</p>
              <h2 className="mt-1.5 font-display text-xl font-extrabold text-light">Задачи команды</h2>
            </div>
            <div className="flex gap-2 text-[11px]">
              <span className="rounded-full border border-brand-lime/30 bg-brand-lime/[0.06] px-3 py-1 text-brand-lime">
                в работе {openTasks.length}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-light/50">
                готово {doneTasks.length}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 12).map((x) => (
              <div
                key={x.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-2xl border p-3.5',
                  x.done ? 'border-white/[0.04] bg-white/[0.012]' : 'border-white/[0.06] bg-white/[0.02]',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[11px]',
                    x.done ? 'border-brand-lime/50 bg-brand-lime/15 text-brand-lime' : 'border-white/15 text-transparent',
                  )}
                >
                  ✓
                </span>
                <span className={cn('min-w-0 flex-1 truncate text-[13.5px]', x.done ? 'text-light/45' : 'text-light')}>
                  {x.title}
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-light/30">
                  {KIND_LABEL[x.kind] ?? 'Задача'}
                </span>
                <span className="shrink-0 text-[11px] text-light/40">{fmtDay(x.date)}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.12em]',
                    x.done ? 'bg-emerald-400/10 text-emerald-300' : 'bg-brand-lime/10 text-brand-lime',
                  )}
                >
                  {x.done ? 'готово' : 'в процессе'}
                </span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Отчёты по месяцам ── */}
      {reportList.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7"
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Архив</p>
          <h2 className="mb-5 mt-1.5 font-display text-xl font-extrabold text-light">Отчёты по месяцам</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reportList.map((r, i) => {
              const rRoas = r.spent > 0 ? r.revenue / r.spent : 0;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + Math.min(i * 0.04, 0.4) }}
                >
                  <Link
                    href={`/dashboard/reports/${r.id}/print`}
                    className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-brand-lime/35"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] font-medium text-light group-hover:text-brand-lime">
                        {monthLabel(r.month, r.year)}
                      </span>
                      {rRoas > 0 && (
                        <span className="rounded-full border border-brand-lime/25 bg-brand-lime/[0.06] px-2 py-0.5 font-mono text-[10px] text-brand-lime">
                          ×{rRoas.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 font-display text-xl font-extrabold text-light">{formatMoney(r.revenue)}</div>
                    <div className="mt-1 text-[11px] text-light/35">
                      {formatInt(r.leads)} заявок · открыть отчёт →
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}
    </div>
  );
}
