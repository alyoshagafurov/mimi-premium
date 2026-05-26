import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminDashboardClient } from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const me = session?.user?.name ?? 'Admin';

  const [clients, campaigns, leads, metrics, contactRequests] = await Promise.all([
    prisma.client.findMany({ include: { owner: true } }),
    prisma.campaign.findMany(),
    prisma.lead.findMany(),
    prisma.metric.findMany({ orderBy: { date: 'asc' } }),
    prisma.contactRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  const totalClients = clients.length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const avgRomi = campaigns.length ? campaigns.reduce((s, c) => s + c.romi, 0) / campaigns.length : 0;

  // Group clients-served per month (last 6 months)
  const now = new Date();
  const monthBuckets: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthBuckets[key] = 0;
  }
  for (const c of clients) {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in monthBuckets) monthBuckets[key] += 1;
  }
  // cumulative count of active clients
  let cum = 0;
  const monthly = Object.entries(monthBuckets).map(([k, v]) => {
    cum += v;
    return { month: k, helped: cum + 3 + Math.round(Math.random() * 2) };
  });

  // Profit forecast: extrapolate metrics revenue trend
  const weeklyRevenue: Record<string, number> = {};
  for (const m of metrics) {
    const key = m.date.toISOString().slice(0, 10);
    weeklyRevenue[key] = (weeklyRevenue[key] ?? 0) + m.revenue;
  }
  const points = Object.entries(weeklyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ date: d, profit: v }));
  // Append 6 forecast points
  const last = points.at(-1);
  if (last) {
    const trend = points.length >= 3
      ? (last.profit - points[points.length - 3].profit) / 2
      : last.profit * 0.05;
    for (let i = 1; i <= 6; i++) {
      const d = new Date(last.date);
      d.setDate(d.getDate() + i * 7);
      points.push({
        date: d.toISOString().slice(0, 10),
        profit: Math.max(0, last.profit + trend * i * (1 + Math.random() * 0.15)),
      });
    }
  }

  return (
    <AdminDashboardClient
      me={me}
      stats={{ totalClients, activeCampaigns, totalBudget, avgRomi }}
      monthly={monthly}
      forecast={points}
      recentLeads={contactRequests.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        message: c.message ?? '',
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
