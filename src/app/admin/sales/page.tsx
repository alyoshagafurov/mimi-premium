import { prisma } from '@/lib/prisma';
import { getSafeSession } from '@/lib/session';
import { canSeeRevenue, isAdminLike, LEAD_ROLES } from '@/lib/roles';
import { SalesClient } from './SalesClient';

export default async function AdminSalesPage() {
  const session = await getSafeSession();
  const me = session?.user as any;
  // Админ и операционный директор видят все лиды; продажник и разработчик —
  // те, где они в числе ответственных. Ответственных может быть несколько, и
  // лид видит каждый из них.
  const seesAllLeads = isAdminLike(me?.role);
  // Only the full ADMIN sees everyone's personal lead statistics.
  const seesEveryone = canSeeRevenue(me?.role);
  const leadScope = seesAllLeads ? {} : { assignees: { some: { id: me?.id ?? '__none__' } } };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7)); // понедельник
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const since = (from: Date) => ({ ...leadScope, createdAt: { gte: from } });

  const [clients, reps, byDay, byWeek, byMonth, byYear, byTotal] = await Promise.all([
    prisma.client.findMany({
      relationLoadStrategy: 'join',
      where: leadScope,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, businessName: true, niche: true, contactName: true,
        salesStatus: true, packageType: true, sourceType: true, sourceUrl: true,
        sourceCover: true, sourceNote: true, reminderAt: true, reminderNote: true,
        reminderDone: true, createdAt: true,
        owner: { select: { phone: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        assignees: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
    relationLoadStrategy: 'join',
      where: seesAllLeads ? { role: { in: LEAD_ROLES } } : { id: me?.id ?? '__none__' },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
    prisma.client.groupBy({ by: ['createdById'], where: since(startOfDay), _count: { _all: true } }),
    prisma.client.groupBy({ by: ['createdById'], where: since(startOfWeek), _count: { _all: true } }),
    prisma.client.groupBy({ by: ['createdById'], where: since(startOfMonth), _count: { _all: true } }),
    prisma.client.groupBy({ by: ['createdById'], where: since(startOfYear), _count: { _all: true } }),
    prisma.client.groupBy({ by: ['createdById'], where: leadScope, _count: { _all: true } }),
  ]);

  const pick = (rows: { createdById: string | null; _count: { _all: number } }[], id: string) =>
    rows.find((r) => r.createdById === id)?._count._all ?? 0;

  // «Сколько лидов добавлено» — за день / неделю / месяц / год.
  const repStats = reps
    .map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role as string,
      day: pick(byDay, r.id),
      week: pick(byWeek, r.id),
      month: pick(byMonth, r.id),
      year: pick(byYear, r.id),
      total: pick(byTotal, r.id),
    }))
    // Everyone who can add leads is listed — including админ и опер. директор,
    // even with a zero count.
    .sort((a, b) => b.month - a.month || b.total - a.total);

  return (
    <SalesClient
      meId={me?.id ?? ''}
      seesEveryone={seesEveryone}
      seesAllLeads={seesAllLeads}
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
        createdById: c.createdBy?.id ?? null,
        createdByName: c.createdBy?.name ?? null,
        assigneeIds: c.assignees.map((a) => a.id),
        assigneeNames: c.assignees.map((a) => a.name),
        reminderAt: c.reminderAt?.toISOString() ?? null,
        reminderNote: c.reminderNote ?? '',
        reminderDone: c.reminderDone,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
