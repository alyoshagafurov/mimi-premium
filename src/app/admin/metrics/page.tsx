import { prisma } from '@/lib/prisma';
import { MetricsClient } from './MetricsClient';

export default async function AdminMetricsPage() {
  const [metrics, clients] = await Promise.all([
    prisma.metric.findMany({ include: { client: true }, orderBy: { date: 'desc' }, take: 100 }),
    prisma.client.findMany(),
  ]);
  return (
    <MetricsClient
      metrics={metrics.map((m) => ({
        id: m.id,
        clientId: m.clientId,
        clientName: m.client.businessName,
        date: m.date.toISOString(),
        clicks: m.clicks,
        leads: m.leads,
        qualified: m.qualified,
        sales: m.sales,
        spent: m.spent,
        revenue: m.revenue,
        romi: m.romi,
      }))}
      clients={clients.map((c) => ({ id: c.id, name: c.businessName }))}
    />
  );
}
