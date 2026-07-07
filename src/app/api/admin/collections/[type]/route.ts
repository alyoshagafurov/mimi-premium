import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { getCollection, coerceBody } from '@/lib/cms-collections';

export async function POST(req: Request, { params }: { params: { type: string } }) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const col = getCollection(params.type);
  if (!col) return NextResponse.json({ error: 'unknown_collection' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data = coerceBody(col, body);

  // Required-field guard
  for (const f of col.fields) {
    if (f.required && !data[f.name]) {
      return NextResponse.json({ error: `Поле «${f.label}» обязательно` }, { status: 400 });
    }
  }

  const created = await (prisma as any)[col.model].create({ data });
  return NextResponse.json({ id: created.id });
}
