import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json();
  const data: any = {};
  for (const k of ['title', 'description', 'kind', 'clientId']) if (k in body) data[k] = body[k];
  if ('startAt' in body) data.startAt = new Date(body.startAt);
  if ('endAt' in body) data.endAt = body.endAt ? new Date(body.endAt) : null;
  const ev = await prisma.calendarEvent.update({ where: { id: params.id }, data });
  return NextResponse.json(ev);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await prisma.calendarEvent.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
