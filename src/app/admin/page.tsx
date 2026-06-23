import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { DEAL_STAGES, monthName } from '@/lib/utils';
import { AdminDashboardClient } from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const session = await getSafeSession();
  const me = session?.user?.name ?? 'Admin';

  const [clients, deals, tasks, payments] = await Promise.all([
    prisma.client.findMany({ include: { owner: { select: { name: true, tariff: true, tariffEnd: true } } } }),
    prisma.deal.findMany({ select: { stage: true, amount: true } }),
    prisma.task.findMany({
      where: { done: false },
      orderBy: [{ dueDate: 'asc' }],
      take: 8,
      include: { client: { select: { businessName: true } }, deal: { select: { title: true } } },
    }),
    prisma.payment.findMany(),
  ]);

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'ACTIVE').length;
  const activeDeals = deals.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST').length;

  // Finance
  const revenueMonth = payments
    .filter((p) => p.status === 'PAID' && p.year === curYear && p.month === curMonth)
    .reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter((p) => p.status === 'OVERDUE').reduce((s, p) => s + p.amount, 0);

  // Pipeline summary
  const pipeline = DEAL_STAGES.map((stage) => {
    const col = deals.filter((d) => d.stage === stage);
    return { stage, count: col.length, sum: col.reduce((s, d) => s + d.amount, 0) };
  });

  // Revenue trend — paid amount per month, last 6 months
  const buckets: { key: string; label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(curYear, now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: monthName(d.getMonth() + 1), amount: 0 });
  }
  for (const p of payments) {
    if (p.status !== 'PAID') continue;
    const b = buckets.find((x) => x.key === `${p.year}-${p.month}`);
    if (b) b.amount += p.amount;
  }
  const revenueTrend = buckets.map(({ label, amount }) => ({ label, amount }));

  // Tariff-renewal reminders (≤ 30 days, or already overdue)
  const dayMs = 1000 * 60 * 60 * 24;
  const renewals = clients
    .filter((c) => c.owner.tariff !== 'NONE' && c.owner.tariffEnd)
    .map((c) => ({
      businessName: c.businessName,
      tariff: c.owner.tariff,
      daysLeft: Math.ceil((new Date(c.owner.tariffEnd!).getTime() - now.getTime()) / dayMs),
    }))
    .filter((r) => r.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <AdminDashboardClient
      me={me}
      stats={{ totalClients, activeClients, activeDeals, revenueMonth, overdue }}
      pipeline={pipeline}
      revenueTrend={revenueTrend}
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate?.toISOString() ?? null,
        context: t.client?.businessName ?? t.deal?.title ?? null,
      }))}
      renewals={renewals}
    />
  );
}
