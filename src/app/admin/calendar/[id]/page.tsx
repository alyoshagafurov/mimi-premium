import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isStaff, isAdminLike, visibleCategories, CATEGORY_LABEL, type EventCategory, userRoles } from '@/lib/roles';
import { EventDetail } from './EventDetail';

/** Страница события: вся информация, статус и личные заметки. */
export default async function CalendarEventPage({ params }: { params: { id: string } }) {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!isStaff(userRoles(me))) redirect('/admin');

  const canManage = isAdminLike(userRoles(me));

  const [e, clients, staff] = await Promise.all([
    prisma.calendarEvent.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, businessName: true, logo: true } },
      owner: { select: { id: true, name: true } },
      assignees: { select: { id: true, name: true, avatar: true, jobTitle: true, role: true } },
      notes: {
        where: { authorId: me.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, body: true, createdAt: true },
      },
    },
    }),
    // Списки для формы правки — те же, что в календаре: проекты и сотрудники.
    canManage
      ? prisma.client.findMany({
          where: { salesStatus: 'PARTNER' },
          select: { id: true, businessName: true },
          orderBy: { businessName: 'asc' },
        })
      : Promise.resolve([]),
    canManage
      ? prisma.user.findMany({
          where: { role: { not: 'CLIENT' } },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ]);
  if (!e) notFound();

  // Своё событие или событие своего направления — иначе не показываем.
  const mine = e.ownerId === me.id || e.assignees.some((a) => a.id === me.id);
  const inMyCategory = (visibleCategories(userRoles(me)) as string[]).includes(e.category);
  if (!canManage && !mine && !inMyCategory) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/calendar" className="inline-block text-xs uppercase tracking-[0.18em] text-light/45 hover:text-brand-lime">
        ← Календарь
      </Link>

      <EventDetail
        canManage={canManage}
        canDelete={canManage || e.ownerId === me.id}
        clients={clients}
        staff={staff}
        event={{
          id: e.id,
          title: e.title,
          description: e.description ?? '',
          kind: e.kind,
          category: e.category,
          categoryLabel: CATEGORY_LABEL[e.category as EventCategory],
          startAt: e.startAt.toISOString(),
          endAt: e.endAt?.toISOString() ?? null,
          done: e.done,
          doneAt: e.doneAt?.toISOString() ?? null,
          clientId: e.client?.id ?? null,
          clientName: e.client?.businessName ?? null,
          clientLogo: e.client?.logo ?? null,
          ownerName: e.owner?.name ?? null,
          assignees: e.assignees.map((a) => ({
            id: a.id, name: a.name, avatar: a.avatar, jobTitle: a.jobTitle ?? '',
          })),
          assigneeIds: e.assignees.map((a) => a.id),
          createdAt: e.createdAt.toISOString(),
        }}
        notes={e.notes.map((n) => ({
          id: n.id, body: n.body, createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
