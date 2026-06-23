import { prisma } from '@/lib/prisma';
import { CalendarClient } from './CalendarClient';

export default async function AdminCalendarPage() {
  const [events, clients] = await Promise.all([
    prisma.calendarEvent.findMany({
      orderBy: { startAt: 'asc' },
      include: { client: { select: { id: true, businessName: true } } },
    }),
    prisma.client.findMany({ select: { id: true, businessName: true } }),
  ]);
  return (
    <CalendarClient
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? '',
        kind: e.kind,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt?.toISOString() ?? null,
        clientId: e.clientId ?? null,
        clientName: e.client?.businessName ?? null,
      }))}
      clients={clients}
    />
  );
}
