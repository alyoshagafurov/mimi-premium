import { NextResponse } from 'next/server';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

export async function GET(req: Request) {
  const session = await getSafeSession();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const where: any = {};
  if (from || to) {
    where.startAt = {};
    if (from) where.startAt.gte = new Date(from);
    if (to) where.startAt.lte = new Date(to);
  }
  const events = await prisma.calendarEvent.findMany({
    where,
    orderBy: { startAt: 'asc' },
    include: { client: { select: { id: true, businessName: true } }, owner: { select: { name: true } } },
  });
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;
  const body = await req.json();
  const ev = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      kind: body.kind ?? 'MEETING',
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : null,
      clientId: body.clientId ?? null,
      ownerId: me.id,
    },
  });
  return NextResponse.json(ev);
}
