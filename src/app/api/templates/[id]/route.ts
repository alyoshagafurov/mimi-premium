import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await ensureAdmin();
  if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await prisma.taskTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
