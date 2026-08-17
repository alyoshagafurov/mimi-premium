import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureStaff } from '@/lib/api-guard';

/** Личные заметки: каждый сотрудник видит и правит только свои. */
export async function POST(req: Request) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;

  const payload = await req.json().catch(() => ({}));
  const text = String(payload.body ?? '').trim();
  if (!text) return NextResponse.json({ error: 'Пустая заметка' }, { status: 400 });

  const note = await prisma.staffNote.create({
    data: {
      body: text.slice(0, 2000),
      authorId: me.id,
      remindAt: payload.remindAt ? new Date(payload.remindAt) : null,
      remindText: String(payload.remindText ?? '').trim().slice(0, 300) || null,
    },
  });
  return NextResponse.json({
    id: note.id,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
    remindAt: note.remindAt?.toISOString() ?? null,
    remindText: note.remindText,
    eventId: null,
    eventTitle: null,
  });
}
