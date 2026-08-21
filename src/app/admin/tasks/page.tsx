import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isAdminLike, isStaff, visibleCategories } from '@/lib/roles';
import { redirect } from 'next/navigation';
import { TasksClient, type TaskRow } from './TasksClient';

/**
 * Единый список задач: и то, что заведено в календаре (события), и то, что
 * поставлено команде/по проекту (задачи). Фильтры — на клиенте.
 */
export default async function TasksPage() {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!isStaff(me?.role)) redirect('/admin');
  const adminLike = isAdminLike(me.role);
  const cats = visibleCategories(me.role) as any[];

  // Сотрудник видит задачи своего направления и всё, где он ответственный.
  const taskWhere = adminLike ? {} : { OR: [{ category: { in: cats } }, { ownerId: me.id }] };
  const eventWhere = adminLike
    ? {}
    : { OR: [{ category: { in: cats } }, { ownerId: me.id }, { assignees: { some: { id: me.id } } }] };

  const [tasks, events, staff, projects] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere,
      orderBy: [{ done: 'asc' }, { dueDate: 'asc' }],
      select: {
        id: true, title: true, done: true, dueDate: true, createdAt: true,
        category: true, priority: true,
        owner: { select: { id: true, name: true } },
        client: { select: { id: true, businessName: true } },
      },
    }),
    prisma.calendarEvent.findMany({
      where: eventWhere,
      orderBy: [{ done: 'asc' }, { startAt: 'desc' }],
      select: {
        id: true, title: true, done: true, doneAt: true, startAt: true, category: true, kind: true,
        assignees: { select: { id: true, name: true } },
        client: { select: { id: true, businessName: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { not: 'CLIENT' }, approvedAt: { not: null } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.client.findMany({
      where: { salesStatus: 'PARTNER' },
      select: { id: true, businessName: true },
      orderBy: { businessName: 'asc' },
    }),
  ]);

  const rows: TaskRow[] = [
    ...tasks.map((t) => ({
      id: t.id,
      source: 'task' as const,
      title: t.title,
      done: t.done,
      date: (t.dueDate ?? t.createdAt).toISOString(),
      hasDueDate: !!t.dueDate,
      category: t.category as string,
      priority: t.priority as string,
      projectId: t.client?.id ?? null,
      projectName: t.client?.businessName ?? null,
      people: t.owner ? [{ id: t.owner.id, name: t.owner.name }] : [],
      href: null,
      // У старых задач нет времени закрытия — «успели / опоздали» не посчитать.
      doneAt: null,
      isTask: false,
    })),
    ...events.map((e) => ({
      id: e.id,
      source: 'event' as const,
      title: e.title,
      done: e.done,
      date: e.startAt.toISOString(),
      hasDueDate: true,
      category: e.category as string,
      priority: null,
      projectId: e.client?.id ?? null,
      projectName: e.client?.businessName ?? null,
      people: e.assignees.map((a) => ({ id: a.id, name: a.name })),
      href: `/admin/calendar/${e.id}`,
      doneAt: e.doneAt?.toISOString() ?? null,
      isTask: e.kind === 'TASK',
    })),
  ].sort((a, b) => (a.done === b.done ? b.date.localeCompare(a.date) : a.done ? 1 : -1));

  return (
    <TasksClient
      rows={rows}
      staff={staff.map((s) => ({ id: s.id, name: s.name }))}
      projects={projects.map((p) => ({ id: p.id, name: p.businessName }))}
      canToggle
      canCreate={adminLike}
    />
  );
}
