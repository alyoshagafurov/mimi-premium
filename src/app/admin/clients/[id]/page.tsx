import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ClientManageClient } from './ClientManageClient';
import { ClientCrmPanel } from './ClientCrmPanel';

export default async function AdminClientManagePage({ params }: { params: { id: string } }) {
  const [client, team] = await Promise.all([
    prisma.client.findUnique({
    relationLoadStrategy: 'join',
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true, avatar: true, tariff: true, tariffEnd: true } },
        reports: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          include: {
            platforms: { orderBy: { name: 'asc' } },
            campaigns: { orderBy: { createdAt: 'asc' } },
            audience: true,
          },
        },
        payments: { orderBy: [{ year: 'desc' }, { month: 'desc' }] },
        tasks: { orderBy: [{ done: 'asc' }, { dueDate: 'asc' }] },
        activities: { orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, name: true } }),
  ]);

  if (!client) notFound();

  return (
    <div className="space-y-8">
      <ClientManageClient
        client={{
          id: client.id,
          businessName: client.businessName,
          niche: client.niche,
          status: client.status,
          ownerName: client.owner.name,
          ownerEmail: client.owner.email,
          tariff: client.owner.tariff,
        }}
        reports={client.reports.map((r) => ({
          id: r.id,
          month: r.month,
          year: r.year,
          spent: r.spent,
          budget: r.budget,
          reach: r.reach,
          clicks: r.clicks,
          leads: r.leads,
          revenue: r.revenue,
          profileVisits: r.profileVisits,
          campaignCount: r.campaignCount,
          platforms: r.platforms.map((p) => ({ name: p.name, spent: p.spent, roas: p.roas })),
          audience: r.audience
            ? {
                age18_24: r.audience.age18_24,
                age25_34: r.audience.age25_34,
                age35_44: r.audience.age35_44,
                age45plus: r.audience.age45plus,
              }
            : null,
          campaigns: r.campaigns.map((c) => ({ id: c.id, name: c.name, platform: c.platform, status: c.status })),
        }))}
      />

      <ClientCrmPanel
        clientId={client.id}
        team={team}
        payments={client.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          month: p.month,
          year: p.year,
          dueDate: p.dueDate?.toISOString() ?? null,
          paidAt: p.paidAt?.toISOString() ?? null,
          method: p.method ?? '',
          note: p.note ?? '',
        }))}
        tasks={client.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          done: t.done,
          dueDate: t.dueDate?.toISOString() ?? null,
          priority: t.priority,
        }))}
        activities={client.activities.map((a) => ({
          id: a.id,
          kind: a.kind,
          body: a.body,
          createdAt: a.createdAt.toISOString(),
          authorName: a.author?.name ?? null,
        }))}
      />
    </div>
  );
}
