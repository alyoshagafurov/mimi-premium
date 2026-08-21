import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { canSeeRevenue } from '@/lib/roles';
import { FinanceClient } from './FinanceClient';

const DAY = 86_400_000;
const WEEKS_BACK = 26;

/** Понедельник недели, в которую попадает дата (локальная полночь). */
function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (x.getDay() + 6) % 7; // вс = 6
  x.setDate(x.getDate() - shift);
  return x;
}

export default async function FinancePage() {
  const session = await getSafeSession();
  if (!canSeeRevenue((session?.user as any)?.role)) redirect('/admin');

  const payments = await prisma.payment.findMany({
    where: { status: 'PAID' },
    select: {
      amount: true, month: true, year: true, paidAt: true, dueDate: true, createdAt: true,
      client: { select: { id: true, businessName: true } },
    },
  });

  const total = payments.reduce((s, p) => s + p.amount, 0);

  /* ── По годам ── */
  const yearMap = new Map<number, number>();
  for (const p of payments) yearMap.set(p.year, (yearMap.get(p.year) ?? 0) + p.amount);
  const years = [...yearMap.keys()].sort((a, b) => a - b);
  const byYear = years.map((year) => ({ year, amount: yearMap.get(year)! }));

  /* ── По месяцам для каждого года ── */
  const byMonth: Record<number, number[]> = {};
  for (const y of years) byMonth[y] = Array(12).fill(0);
  for (const p of payments) {
    const m = Math.min(12, Math.max(1, p.month)) - 1;
    if (byMonth[p.year]) byMonth[p.year][m] += p.amount;
  }

  /* ── По неделям: последние 26 недель ── */
  const thisWeek = weekStart(new Date());
  const weekBuckets = Array.from({ length: WEEKS_BACK }, (_, i) => {
    const start = new Date(thisWeek.getTime() - (WEEKS_BACK - 1 - i) * 7 * DAY);
    return { start: start.toISOString(), amount: 0 };
  });
  const firstWeekMs = new Date(weekBuckets[0].start).getTime();
  for (const p of payments) {
    const d = p.paidAt ?? p.dueDate ?? new Date(p.year, Math.max(0, p.month - 1), 1);
    const ws = weekStart(d).getTime();
    if (ws < firstWeekMs) continue;
    const idx = Math.round((ws - firstWeekMs) / (7 * DAY));
    if (idx >= 0 && idx < WEEKS_BACK) weekBuckets[idx].amount += p.amount;
  }

  /* ── Кто сколько принёс (для разбивки года) ── */
  const clientMap = new Map<string, { id: string; name: string; amount: number }>();
  for (const p of payments) {
    if (!p.client) continue;
    const cur = clientMap.get(p.client.id) ?? { id: p.client.id, name: p.client.businessName, amount: 0 };
    cur.amount += p.amount;
    clientMap.set(p.client.id, cur);
  }
  const topClients = [...clientMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 8);

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonthAmount = byMonth[curYear]?.[now.getMonth()] ?? 0;
  const prevMonthDate = new Date(curYear, now.getMonth() - 1, 1);
  const prevMonthAmount = byMonth[prevMonthDate.getFullYear()]?.[prevMonthDate.getMonth()] ?? 0;

  return (
    <FinanceClient
      total={total}
      invoices={payments.length}
      payers={clientMap.size}
      byYear={byYear}
      byMonth={byMonth}
      byWeek={weekBuckets}
      topClients={topClients}
      currentYear={curYear}
      currentMonthAmount={curMonthAmount}
      prevMonthAmount={prevMonthAmount}
    />
  );
}
