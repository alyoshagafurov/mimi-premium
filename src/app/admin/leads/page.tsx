import { prisma } from '@/lib/prisma';
import { LeadsClient } from './LeadsClient';

export default async function AdminLeadsPage() {
  const requests = await prisma.contactRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <LeadsClient
      leads={requests.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        message: r.message ?? '',
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
