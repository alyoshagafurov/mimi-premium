import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isAdminLike, visibleCategories } from '@/lib/roles';
import { CalendarClient } from './CalendarClient';

export default async function AdminCalendarPage() {
  const session = await getSafeSession();
  const role = (session?.user as any)?.role as string;
  const canManage = isAdminLike(role);
  const cats = visibleCategories(role);

  const [events, clients, staff] = await Promise.all([
    prisma.calendarEvent.findMany({
    relationLoadStrategy: 'join',
      where: { category: { in: cats } },
      orderBy: { startAt: 'asc' },
      include: {
        client: { select: { id: true, businessName: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    canManage
      ? prisma.client.findMany({
    relationLoadStrategy: 'join', select: { id: true, businessName: true }, orderBy: { businessName: 'asc' } })
      : Promise.resolve([]),
    canManage
      ? prisma.user.findMany({
    relationLoadStrategy: 'join',
          where: { role: { not: 'CLIENT' } },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ]);

  return (
    <CalendarClient
      role={role}
      canManage={canManage}
      categories={cats}
      clients={clients}
      staff={staff}
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? '',
        kind: e.kind,
        category: e.category,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt?.toISOString() ?? null,
        clientId: e.clientId ?? null,
        clientName: e.client?.businessName ?? null,
        assigneeId: e.assigneeId ?? null,
        assigneeName: e.assignee?.name ?? null,
      }))}
    />
  );
}
