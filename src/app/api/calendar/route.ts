import { NextResponse } from 'next/server';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike, ensureStaff } from '@/lib/api-guard';
import { isStaff, isAdminLike, visibleCategories } from '@/lib/roles';

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

  const ev = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      kind: body.kind ?? 'MEETING',
      category,
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : null,
      clientId: adminLike ? (body.clientId ?? null) : null,
      // Ответственных может быть несколько. Сотрудник заводит событие только
      // себе — оно попадёт в «Мой календарь».
      assignees: {
        connect: (adminLike
          ? (Array.isArray(body.assigneeIds) ? body.assigneeIds.filter(Boolean) : [])
          : [me.id]
        ).map((id: string) => ({ id })),
      },
      ownerId: me.id,
    },
  });
  return NextResponse.json(ev);
}
