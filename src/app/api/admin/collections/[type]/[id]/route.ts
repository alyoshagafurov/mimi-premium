import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { getCollection, coerceBody } from '@/lib/cms-collections';

export async function PATCH(req: Request, { params }: { params: { type: string; id: string } }) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const col = getCollection(params.type);
  if (!col) return NextResponse.json({ error: 'unknown_collection' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data = coerceBody(col, body);
  const updated = await (prisma as any)[col.model].update({ where: { id: params.id }, data });
  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_req: Request, { params }: { params: { type: string; id: string } }) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const col = getCollection(params.type);
  if (!col) return NextResponse.json({ error: 'unknown_collection' }, { status: 404 });
  await (prisma as any)[col.model].delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
