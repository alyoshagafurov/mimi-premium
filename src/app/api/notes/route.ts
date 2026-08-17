import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureStaff } from '@/lib/api-guard';

/** Личные заметки: каждый сотрудник видит и правит только свои. */
export async function POST(req: Request) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;

  const { body } = await req.json().catch(() => ({ body: '' }));
  const text = String(body ?? '').trim();
  if (!text) return NextResponse.json({ error: 'Пустая заметка' }, { status: 400 });

  const note = await prisma.staffNote.create({
    data: { body: text.slice(0, 2000), authorId: me.id },
  });
  return NextResponse.json({
    id: note.id,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
    eventId: null,
    eventTitle: null,
  });
}
