import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';

/** Убрать заметку из кабинета клиента. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const message = await prisma.message.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!message) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await prisma.message.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
