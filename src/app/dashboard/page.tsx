import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: {
      client: {
        include: {
          campaigns: true,
          leads: { orderBy: { createdAt: 'desc' }, take: 10 },
          metrics: { orderBy: { date: 'asc' } },
        },
      },
    },
  });

  if (!user || !user.client) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Кабинет почти готов</h1>
        <p className="mt-3 text-muted">
          Свяжитесь с менеджером, чтобы привязать ваш бизнес-аккаунт.
        </p>
      </main>
    );
  }

  const metrics = user.client.metrics;
  const last = metrics.at(-1);
  const prev = metrics.at(-2);
  const totalSpentMonth = metrics.slice(-4).reduce((s, m) => s + m.spent, 0);
  const totalLeadsMonth = metrics.slice(-4).reduce((s, m) => s + m.leads, 0);
  const totalSalesMonth = metrics.slice(-4).reduce((s, m) => s + m.sales, 0);
  const totalRevenueMonth = metrics.slice(-4).reduce((s, m) => s + m.revenue, 0);
  const romiAvg = totalSpentMonth > 0 ? ((totalRevenueMonth - totalSpentMonth) / totalSpentMonth) * 100 : 0;

  const deltaPct = (cur?: number, p?: number) => (!cur || !p) ? 0 : ((cur - p) / p) * 100;

  const funnel = [
    { label: 'Клики', value: metrics.slice(-4).reduce((s, m) => s + m.clicks, 0) },
    { label: 'Заявки', value: totalLeadsMonth },
    { label: 'Квалифицированные', value: metrics.slice(-4).reduce((s, m) => s + m.qualified, 0) },
    { label: 'Продажи', value: totalSalesMonth },
  ];

  return (
    <DashboardClient
      user={{
        name: user.name,
        tariff: user.tariff,
        tariffEnd: user.tariffEnd?.toISOString() ?? null,
      }}
      kpi={{
        spent: totalSpentMonth,
        leads: totalLeadsMonth,
        sales: totalSalesMonth,
        romi: romiAvg,
        spentDelta: deltaPct(last?.spent, prev?.spent),
        leadsDelta: deltaPct(last?.leads, prev?.leads),
        salesDelta: deltaPct(last?.sales, prev?.sales),
        romiDelta: deltaPct(last?.romi, prev?.romi),
      }}
      chart={metrics.map((m) => ({
        date: m.date.toISOString(),
        romi: m.romi,
        revenue: m.revenue,
      }))}
      funnel={funnel}
      leads={user.client.leads.map((l) => ({
        id: l.id,
        name: l.name,
        contact: l.contact,
        source: l.source,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      }))}
      campaigns={user.client.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        budget: c.budget,
        spent: c.spent,
        leads: c.leads,
        sales: c.sales,
        romi: c.romi,
        status: c.status,
      }))}
      business={{ name: user.client.businessName, niche: user.client.niche }}
    />
  );
}
