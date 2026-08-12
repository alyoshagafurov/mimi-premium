import { prisma } from '@/lib/prisma';
import { getSafeSession } from '@/lib/session';
import { SalesClient } from './SalesClient';

export default async function AdminSalesPage() {
  const session = await getSafeSession();
  const me = session?.user as any;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7)); // понедельник
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [clients, reps, byDay, byWeek, byMonth, byTotal] = await Promise.all([
    prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, businessName: true, niche: true, contactName: true,
        salesStatus: true, packageType: true, sourceType: true, sourceUrl: true,
        sourceCover: true, sourceNote: true, reminderAt: true, reminderNote: true,
        reminderDone: true, createdAt: true,
        owner: { select: { phone: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['SALES', 'ADMIN', 'OPS_DIRECTOR'] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
    prisma.client.groupBy({ by: ['createdById'], where: { createdAt: { gte: startOfDay } }, _count: { _all: true } }),
    prisma.client.groupBy({ by: ['createdById'], where: { createdAt: { gte: startOfWeek } }, _count: { _all: true } }),
    prisma.client.groupBy({ by: ['createdById'], where: { createdAt: { gte: startOfMonth } }, _count: { _all: true } }),
    prisma.client.groupBy({ by: ['createdById'], _count: { _all: true } }),
  ]);

  const pick = (rows: { createdById: string | null; _count: { _all: number } }[], id: string) =>
    rows.find((r) => r.createdById === id)?._count._all ?? 0;

  // «Сколько лидов добавлено» по каждому продажнику — за день / неделю / месяц.
  const repStats = reps
    .map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role as string,
      day: pick(byDay, r.id),
      week: pick(byWeek, r.id),
      month: pick(byMonth, r.id),
      total: pick(byTotal, r.id),
    }))
    .filter((r) => r.total > 0 || r.role === 'SALES')
    .sort((a, b) => b.month - a.month || b.total - a.total);

  return (
    <SalesClient
      meId={me?.id ?? ''}
      repStats={repStats}
      leads={clients.map((c) => ({
        id: c.id,
        businessName: c.businessName,
        niche: c.niche,
        contactName: c.contactName ?? c.businessName,
        phone: c.owner.phone ?? '',
        email: c.owner.email,
        salesStatus: c.salesStatus,
        packageType: c.packageType,
        sourceType: c.sourceType,
        sourceUrl: c.sourceUrl,
        sourceCover: c.sourceCover,
        sourceNote: c.sourceNote,
        createdByName: c.createdBy?.name ?? null,
        assignedToName: c.assignedTo?.name ?? null,
        assignedToId: c.assignedTo?.id ?? null,
        reminderAt: c.reminderAt?.toISOString() ?? null,
        reminderNote: c.reminderNote ?? '',
        reminderDone: c.reminderDone,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
