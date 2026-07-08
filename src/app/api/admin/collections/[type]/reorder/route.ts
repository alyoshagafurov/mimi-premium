import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { getCollection } from '@/lib/cms-collections';

/** Persist a new order for a collection. Body: { ids[] } → sortOrder = index. */
export async function POST(req: Request, { params }: { params: { type: string } }) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const col = getCollection(params.type);
  if (!col) return NextResponse.json({ error: 'unknown_collection' }, { status: 404 });
  const { ids } = await req.json().catch(() => ({}));
  if (!Array.isArray(ids)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const model = (prisma as any)[col.model];
  await prisma.$transaction(ids.map((id: string, i: number) => model.update({ where: { id }, data: { sortOrder: i } })));
  return NextResponse.json({ ok: true });
}
