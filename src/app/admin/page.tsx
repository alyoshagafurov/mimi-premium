import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { SALES_STATUSES } from '@/lib/roles';
import { AdminDashboardClient } from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const session = await getSafeSession();
  const me = session?.user?.name ?? 'Admin';

  // ПРОЕКТ = партнёр, с которым мы работаем. Раньше считались все активные
  // записи, включая лиды из воронки, — отсюда и завышенное число.
  const IS_PROJECT = { salesStatus: 'PARTNER' as const };

  const [activeProjects, crmGroups, activeTasks, staffCount, partners, debts, eventGroups] = await Promise.all([
    prisma.client.count({ where: { ...IS_PROJECT, status: 'ACTIVE' } }),
    prisma.client.groupBy({ by: ['salesStatus'], _count: { _all: true } }),
    prisma.task.count({ where: { done: false } }),
    prisma.user.count({ where: { role: { not: 'CLIENT' }, approvedAt: { not: null } } }),
    prisma.client.findMany({
      where: IS_PROJECT,
      select: {
        id: true, businessName: true, logo: true, createdAt: true,
        payments: { select: { amount: true, status: true } },
      },
    }),
    // Кто нам должен: неоплаченные и просроченные счета.
    prisma.payment.findMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      select: {
        amount: true, status: true, dueDate: true, month: true, year: true,
        client: { select: { id: true, businessName: true, logo: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
    // Одним запросом: и всего событий, и выполнено, и разрез по направлениям.
    prisma.calendarEvent.groupBy({ by: ['category', 'done'], _count: { _all: true } }),
  ]);

  const crm = SALES_STATUSES.map((status) => ({
    status,
    count: crmGroups.find((g) => g.salesStatus === status)?._count._all ?? 0,
  }));

  /* ── События: всего / выполнено, и по направлениям ── */
  const evCount = (cat?: string, done?: boolean) =>
    eventGroups
      .filter((g) => (cat ? g.category === cat : true) && (done === undefined ? true : g.done === done))
      .reduce((s, g) => s + g._count._all, 0);

  const activeEvents = evCount(undefined, false);
  const doneEvents = evCount(undefined, true);
  const production = (['VIDEO', 'MONTAGE', 'DESIGN'] as const).map((cat) => ({
    cat,
    total: evCount(cat),
    done: evCount(cat, true),
  }));

  /**
   * Конверсия воронки. salesStatus хранит только текущий этап, поэтому
   * «дошло до этапа» = все, кто сейчас на нём или дальше: партнёр когда-то был
   * и новым лидом. Отсюда и проценты перехода между этапами.
   */
  const reached = SALES_STATUSES.map((_, i) =>
    crm.slice(i).reduce((s, c) => s + c.count, 0),
  );
  const funnel = SALES_STATUSES.map((status, i) => ({
    status,
    reached: reached[i],
    // Процент от предыдущего этапа; у первого — доля от всех лидов, то есть 100%.
    pct: i === 0
      ? (reached[0] ? 100 : 0)
      : (reached[i - 1] ? Math.round((reached[i] / reached[i - 1]) * 100) : 0),
  }));
  const totalConversion = reached[0]
    ? Math.round((reached[reached.length - 1] / reached[0]) * 100)
    : 0;

  const now = Date.now();
  const DAY = 86_400_000;

  // Топ-10 по принесённой прибыли (оплаченные счета).
  const byRevenue = partners
    .map((c) => ({
      id: c.id,
      name: c.businessName,
      logo: c.logo,
      revenue: c.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
    }))
    .filter((c) => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Топ-10 по сроку сотрудничества.
  const byTenure = partners
    .map((c) => ({
      id: c.id,
      name: c.businessName,
      logo: c.logo,
      days: Math.max(0, Math.floor((now - c.createdAt.getTime()) / DAY)),
    }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 10);

  // Долги, сгруппированные по проекту.
  const debtMap = new Map<string, { id: string; name: string; logo: string | null; amount: number; overdue: number; nextDue: string | null }>();
  for (const p of debts) {
    if (!p.client) continue;
    const cur = debtMap.get(p.client.id) ?? {
      id: p.client.id, name: p.client.businessName, logo: p.client.logo,
      amount: 0, overdue: 0, nextDue: null,
    };
    cur.amount += p.amount;
    const isOverdue = p.status === 'OVERDUE' || (p.dueDate ? p.dueDate.getTime() < now : false);
    if (isOverdue) cur.overdue += p.amount;
    if (p.dueDate && (!cur.nextDue || p.dueDate.toISOString() < cur.nextDue)) {
      cur.nextDue = p.dueDate.toISOString();
    }
    debtMap.set(p.client.id, cur);
  }
  const owing = [...debtMap.values()].sort((a, b) => b.amount - a.amount);

  return (
    <AdminDashboardClient
      me={me}
      stats={{
        activeProjects, staffCount, activeTasks, activeEvents, doneEvents,
        leadsTotal: crm.reduce((s, c) => s + c.count, 0),
      }}
      crm={crm}
      production={production}
      funnel={funnel}
      totalConversion={totalConversion}
      topRevenue={byRevenue}
      topTenure={byTenure}
      owing={owing}
    />
  );
}
