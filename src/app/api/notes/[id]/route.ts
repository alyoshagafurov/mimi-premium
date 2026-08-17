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

  const payload = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof payload.body === 'string') {
    const text = payload.body.trim();
    if (!text) return NextResponse.json({ error: 'Пустая заметка' }, { status: 400 });
    data.body = text.slice(0, 2000);
  }
  if ('remindAt' in payload) {
    data.remindAt = payload.remindAt ? new Date(payload.remindAt) : null;
    data.remindedAt = null; // новое время — напомнить заново
  }
  if ('remindText' in payload) {
    data.remindText = String(payload.remindText ?? '').trim().slice(0, 300) || null;
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });

  const note = await prisma.staffNote.update({ where: { id: params.id }, data });
  return NextResponse.json({
    id: note.id,
    body: note.body,
    remindAt: note.remindAt?.toISOString() ?? null,
    remindText: note.remindText,
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;
  if (!(await mine(params.id, me.id))) return NextResponse.json({ error: 'Это не ваша заметка' }, { status: 403 });

  await prisma.staffNote.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
