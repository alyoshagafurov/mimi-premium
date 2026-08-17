import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureStaff } from '@/lib/api-guard';

/** Правка/удаление — только автором заметки. */
async function mine(id: string, userId: string) {
  const n = await prisma.staffNote.findUnique({ where: { id }, select: { authorId: true } });
  return n && n.authorId === userId ? n : null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;
  if (!(await mine(params.id, me.id))) return NextResponse.json({ error: 'Это не ваша заметка' }, { status: 403 });

  const { body } = await req.json().catch(() => ({ body: '' }));
  const text = String(body ?? '').trim();
  if (!text) return NextResponse.json({ error: 'Пустая заметка' }, { status: 400 });

  const note = await prisma.staffNote.update({
    where: { id: params.id },
    data: { body: text.slice(0, 2000) },
  });
  return NextResponse.json({ id: note.id, body: note.body });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;
  if (!(await mine(params.id, me.id))) return NextResponse.json({ error: 'Это не ваша заметка' }, { status: 403 });

  await prisma.staffNote.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
