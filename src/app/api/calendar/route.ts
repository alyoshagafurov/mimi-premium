import { NextResponse } from 'next/server';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike, ensureStaff } from '@/lib/api-guard';
import { isStaff, isAdminLike, visibleCategories } from '@/lib/roles';
import { notify } from '@/lib/notify';

export async function GET(req: Request) {
  const session = await getSafeSession();
  const role = (session?.user as any)?.role;
  if (!isStaff(role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const where: any = { category: { in: visibleCategories(role) } };
  if (from || to) {
    where.startAt = {};
    if (from) where.startAt.gte = new Date(from);
    if (to) where.startAt.lte = new Date(to);
  }
  const events = await prisma.calendarEvent.findMany({
    where,
    orderBy: { startAt: 'asc' },
    include: {
      client: { select: { id: true, businessName: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ events });
}

/**
 * Создать событие.
 *   • админ / опер. директор — любое, любому исполнителю и проекту;
 *   • остальные сотрудники — только себе, в свой календарь. Категорию тоже
 *     не выбирают произвольно: берём первую из доступных их роли, иначе чужие
 *     направления засорялись бы личными событиями.
 */
export async function POST(req: Request) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;
  const adminLike = isAdminLike(me.role);

  const body = await req.json();
  if (!body.title || !body.startAt) {
    return NextResponse.json({ error: 'Название и дата обязательны' }, { status: 400 });
  }

  const myCats = visibleCategories(me.role);
  const category = adminLike
    ? (body.category ?? 'GENERAL')
    : ((myCats as string[]).includes(body.category) ? body.category : (myCats[0] ?? 'GENERAL'));

  // Ответственных может быть несколько. Сотрудник заводит событие только
  // себе — оно попадёт в «Мой календарь».
  const assigneeIds: string[] = adminLike
    ? (Array.isArray(body.assigneeIds) ? body.assigneeIds.filter(Boolean) : [])
    : [me.id];
  const clientId = adminLike ? (body.clientId || null) : null;
  const startAt = new Date(body.startAt);

  const ev = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      kind: body.kind ?? 'MEETING',
      category,
      startAt,
      endAt: body.endAt ? new Date(body.endAt) : null,
      clientId,
      assignees: { connect: assigneeIds.map((id: string) => ({ id })) },
      ownerId: me.id,
    },
  });

  // Задача/событие должны прийти как сообщение — иначе о них узнают, только
  // если сами откроют календарь.
  const isTask = ev.kind === 'TASK';
  const when = startAt.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  await Promise.all(
    assigneeIds
      .filter((id) => id !== me.id)
      .map((id) =>
        notify({
          userId: id,
          kind: 'TASK',
          title: isTask ? 'Новая задача' : 'Новое событие',
          body: `${ev.title} — ${isTask ? 'срок' : 'когда'}: ${when}`,
          link: `/admin/calendar/${ev.id}`,
        }).catch(() => {}),
      ),
  );

  // Если задача привязана к проекту — её видит и клиент в своём кабинете.
  if (clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { ownerId: true } });
    if (client && client.ownerId !== me.id) {
      await notify({
        userId: client.ownerId,
        kind: 'TASK',
        title: isTask ? 'Новая задача по вашему проекту' : 'Новое событие по вашему проекту',
        body: `${ev.title} — ${when}`,
        link: '/dashboard/calendar',
      }).catch(() => {});
    }
  }

  return NextResponse.json(ev);
}
