import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike, ensureStaff } from '@/lib/api-guard';
import { isAdminLike, visibleCategories } from '@/lib/roles';

/** An event a staff member may work on: their own, or one in their category. */
async function myEvent(id: string, userId: string, role: string) {
  const ev = await prisma.calendarEvent.findUnique({
    where: { id },
    select: { id: true, ownerId: true, assigneeId: true, category: true },
  });
  if (!ev) return null;
  if (isAdminLike(role)) return ev;
  const mine = ev.ownerId === userId || ev.assigneeId === userId;
  const inMyCategory = (visibleCategories(role) as string[]).includes(ev.category);
  return mine || inMyCategory ? ev : null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;
  const role = me.role as string;

  const ev = await myEvent(params.id, me.id, role);
  if (!ev) return NextResponse.json({ error: 'Нет доступа к событию' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  // Выполнено / в процессе — доступно любому сотруднику по его событиям.
  if (typeof body.done === 'boolean') {
    data.done = body.done;
    data.doneAt = body.done ? new Date() : null;
  }

  // Остальные поля меняет только админ / опер. директор.
  if (isAdminLike(role)) {
    for (const k of ['title', 'description', 'kind', 'category', 'clientId', 'assigneeId']) {
      if (k in body) data[k] = body[k] || null;
    }
    if (body.title) data.title = body.title;
    if ('startAt' in body) data.startAt = new Date(body.startAt);
    if ('endAt' in body) data.endAt = body.endAt ? new Date(body.endAt) : null;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });
  }

  const updated = await prisma.calendarEvent.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

/** Add a personal note to an event — it also shows up in «Заметки». */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;

  const ev = await myEvent(params.id, me.id, me.role as string);
  if (!ev) return NextResponse.json({ error: 'Нет доступа к событию' }, { status: 403 });

  const { body } = await req.json().catch(() => ({ body: '' }));
  const text = String(body ?? '').trim();
  if (!text) return NextResponse.json({ error: 'Пустая заметка' }, { status: 400 });

  const note = await prisma.staffNote.create({
    data: { body: text.slice(0, 2000), authorId: me.id, eventId: params.id },
  });
  return NextResponse.json({
    id: note.id,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
  });
}

/**
 * Удалить событие. Админ/опер. директор — любое; остальные — только те, что
 * завели сами. Событие, назначенное админом, сотрудник удалить не может:
 * оно общее, и его пропажа задела бы других.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;

  if (!isAdminLike(me.role)) {
    const ev = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });
    if (!ev) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (ev.ownerId !== me.id) {
      return NextResponse.json({ error: 'Это событие добавили не вы' }, { status: 403 });
    }
  }

  await prisma.calendarEvent.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
