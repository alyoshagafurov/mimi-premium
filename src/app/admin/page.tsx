import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { monthName } from '@/lib/utils';
import { canSeeRevenue, SALES_STATUSES } from '@/lib/roles';
import { AdminDashboardClient } from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const session = await getSafeSession();
  const me = session?.user?.name ?? 'Admin';
  const showRevenue = canSeeRevenue((session?.user as any)?.role);

  // Counts/aggregates instead of pulling whole tables — keeps the dashboard fast.
  const [totalClients, activeProjects, crmGroups, activeTasks, paidPayments, staffCount] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: 'ACTIVE' } }),
    prisma.client.groupBy({ by: ['salesStatus'], _count: { _all: true } }),
    prisma.task.count({ where: { done: false } }),
    prisma.payment.findMany({ where: { status: 'PAID' }, select: { amount: true, month: true, year: true } }),
    prisma.user.count({ where: { role: { not: 'CLIENT' } } }),
  ]);

  const now = new Date();
  const totalRevenue = paidPayments.reduce((s, p) => s + p.amount, 0);

  // Быстрая статистика CRM — количество лидов по статусу воронки.
  const crm = SALES_STATUSES.map((status) => ({
    status,
    count: crmGroups.find((g) => g.salesStatus === status)?._count._all ?? 0,
  }));

  // Выручка по месяцам — оплачено за последние 6 месяцев.
  const buckets: { key: string; label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: monthName(d.getMonth() + 1), amount: 0 });
  }
  for (const p of paidPayments) {
    const b = buckets.find((x) => x.key === `${p.year}-${p.month}`);
    if (b) b.amount += p.amount;
  }
  const revenueTrend = buckets.map(({ label, amount }) => ({ label, amount }));

  return (
    <AdminDashboardClient
      me={me}
      showRevenue={showRevenue}
      stats={{ activeProjects, staffCount, activeTasks, totalRevenue, totalClients }}
      crm={crm}
      revenueTrend={revenueTrend}
    />
  );
}
