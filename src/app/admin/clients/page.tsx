import { prisma } from '@/lib/prisma';
import { ClientsClient } from './ClientsClient';

export default async function AdminClientsPage() {
  const clients = await prisma.client.findMany({
    include: { owner: true, _count: { select: { reports: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return (
    <ClientsClient
      clients={clients.map((c) => ({
        id: c.id,
        businessName: c.businessName,
        niche: c.niche,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        ownerName: c.owner.name,
        ownerEmail: c.owner.email,
        ownerPhone: c.owner.phone ?? '',
        tariff: c.owner.tariff,
        reports: c._count.reports,
      }))}
    />
  );
}
