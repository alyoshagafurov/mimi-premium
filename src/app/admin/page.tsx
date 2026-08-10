import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { monthName } from '@/lib/utils';
import { canSeeRevenue, SALES_STATUSES } from '@/lib/roles';
import { AdminDashboardClient } from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const session = await getSafeSession();
  const me = session?.user?.name ?? 'Admin';
  const showRevenue = canSeeRevenue((session?.user as any)?.role);

  const [clients, activeTasks, payments, staffCount] = await Promise.all([
    prisma.client.findMany({ select: { businessName: true, status: true, salesStatus: true, createdAt: true } }),
    prisma.task.count({ where: { done: false } }),
    prisma.payment.findMany({ select: { amount: true, status: true, month: true, year: true } }),
    prisma.user.count({ where: { role: { not: 'CLIENT' } } }),
  ]);

  const now = new Date();
  const activeProjects = clients.filter((c) => c.status === 'ACTIVE').length;
  const totalRevenue = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);

  // Быстрая статистика CRM — количество лидов по статусу воронки.
  const crm = SALES_STATUSES.map((status) => ({
    status,
    count: clients.filter((c) => c.salesStatus === status).length,
  }));

  // Проекты, которые сотрудничают дольше всех (самые «старые» первыми).
  const dayMs = 86_400_000;
  const longest = [...clients]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, 5)
    .map((c) => ({
      businessName: c.businessName,
      days: Math.max(0, Math.floor((now.getTime() - c.createdAt.getTime()) / dayMs)),
    }));

  // Выручка по месяцам — оплачено за последние 6 месяцев.
  const buckets: { key: string; label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: monthName(d.getMonth() + 1), amount: 0 });
  }
  for (const p of payments) {
    if (p.status !== 'PAID') continue;
    const b = buckets.find((x) => x.key === `${p.year}-${p.month}`);
    if (b) b.amount += p.amount;
  }
  const revenueTrend = buckets.map(({ label, amount }) => ({ label, amount }));

  return (
    <AdminDashboardClient
      me={me}
      showRevenue={showRevenue}
      stats={{ activeProjects, staffCount, activeTasks, totalRevenue, totalClients: clients.length }}
      crm={crm}
      revenueTrend={revenueTrend}
      longest={longest}
    />
  );
}
