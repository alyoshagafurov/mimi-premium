import { NextResponse } from 'next/server';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';
import { isStaff, visibleCategories } from '@/lib/roles';

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

export async function POST(req: Request) {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;
  const body = await req.json();
  if (!body.title || !body.startAt) {
    return NextResponse.json({ error: 'Название и дата обязательны' }, { status: 400 });
  }
  const ev = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      kind: body.kind ?? 'MEETING',
      category: body.category ?? 'GENERAL',
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : null,
      clientId: body.clientId ?? null,
      assigneeId: body.assigneeId ?? null,
      ownerId: me.id,
    },
  });
  return NextResponse.json(ev);
}
