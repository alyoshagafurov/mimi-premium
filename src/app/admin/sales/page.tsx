import { prisma } from '@/lib/prisma';
import { SalesClient } from './SalesClient';

export default async function AdminSalesPage() {
  const clients = await prisma.client.findMany({
    include: { owner: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <SalesClient
      clients={clients.map((c) => ({
        id: c.id,
        businessName: c.businessName,
        niche: c.niche,
        contactName: c.contactName ?? c.owner.name,
        phone: c.owner.phone ?? '',
        email: c.owner.email,
        salesStatus: c.salesStatus,
        packageType: c.packageType,
        comment: c.comment ?? '',
        reminderAt: c.reminderAt?.toISOString() ?? null,
        reminderNote: c.reminderNote ?? '',
        reminderDone: c.reminderDone,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
