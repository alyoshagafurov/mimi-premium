import { prisma } from '@/lib/prisma';
import { LeadsClient } from './LeadsClient';

export default async function AdminLeadsPage() {
  const [deals, team, clients] = await Promise.all([
    prisma.deal.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: {
        owner: { select: { id: true, name: true } },
        client: { select: { id: true, businessName: true } },
      },
    }),
    prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, name: true } }),
    prisma.client.findMany({ select: { id: true, businessName: true }, orderBy: { businessName: 'asc' } }),
  ]);

  return (
    <LeadsClient
      deals={deals.map((d) => ({
        id: d.id,
        title: d.title,
        contactName: d.contactName,
        phone: d.phone ?? '',
        email: d.email ?? '',
        message: d.message ?? '',
        source: d.source,
        stage: d.stage,
        amount: d.amount,
        ownerId: d.ownerId,
        ownerName: d.owner?.name ?? null,
        clientId: d.clientId,
        clientName: d.client?.businessName ?? null,
        createdAt: d.createdAt.toISOString(),
      }))}
      team={team}
      clients={clients}
    />
  );
}
