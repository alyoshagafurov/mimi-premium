import { prisma } from '@/lib/prisma';
import { ClientsClient } from './ClientsClient';

export default async function AdminClientsPage() {
  // Клиенты = converted partners only (leads live on the Продажи board).
  const clients = await prisma.client.findMany({
    where: { salesStatus: 'PARTNER' },
    include: { owner: true, _count: { select: { reports: true } } },
    // Active projects first, then archived; newest first within each group.
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
  return (
    <ClientsClient
      clients={clients.map((c) => ({
        id: c.id,
        businessName: c.businessName,
        niche: c.niche,
        logo: c.logo,
        status: c.status,
        salesStatus: c.salesStatus,
        createdAt: c.createdAt.toISOString(),
        ownerName: c.owner.name,
        ownerEmail: c.owner.email,
        ownerPhone: c.owner.phone ?? '',
        ownerAvatar: c.owner.avatar ?? null,
        tariff: c.owner.tariff,
        reports: c._count.reports,
      }))}
    />
  );
}
