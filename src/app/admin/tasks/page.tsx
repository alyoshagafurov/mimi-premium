import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isAdminLike, visibleCategories } from '@/lib/roles';
import { TasksClient } from './TasksClient';

export default async function AdminTasksPage() {
  const session = await getSafeSession();
  const role = (session?.user as any)?.role as string;
  const canManage = isAdminLike(role);
  const cats = visibleCategories(role);

  const [tasks, staff, clients] = await Promise.all([
    prisma.task.findMany({
      where: canManage ? {} : { category: { in: cats } },
      orderBy: [{ done: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        client: { select: { id: true, businessName: true } },
        owner: { select: { id: true, name: true } },
      },
    }),
    canManage
      ? prisma.user.findMany({ where: { role: { not: 'CLIENT' } }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
      : Promise.resolve([]),
    canManage
      ? prisma.client.findMany({ select: { id: true, businessName: true }, orderBy: { businessName: 'asc' } })
      : Promise.resolve([]),
  ]);

  return (
    <TasksClient
      canManage={canManage}
      categories={cats}
      staff={staff}
      clients={clients}
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? '',
        done: t.done,
        priority: t.priority,
        category: t.category,
        dueDate: t.dueDate?.toISOString() ?? null,
        clientName: t.client?.businessName ?? null,
        ownerName: t.owner?.name ?? null,
      }))}
    />
  );
}
