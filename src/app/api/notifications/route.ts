import { NextResponse } from 'next/server';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSafeSession();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  // Напоминания по заметкам срабатывают в выбранную минуту, а не ждут суточного
  // крона: превращаем наступившие в уведомления прямо здесь.
  const due = await prisma.staffNote.findMany({
    where: { authorId: userId, remindAt: { not: null, lte: new Date() }, remindedAt: null },
    select: { id: true, body: true, remindText: true },
  });
  if (due.length) {
    await prisma.notification.createMany({
      data: due.map((n) => ({
        userId,
        kind: 'TASK' as const,
        title: 'Напоминание по заметке',
        body: n.remindText || n.body.slice(0, 140),
        link: '/admin/notes',
      })),
    });
    await prisma.staffNote.updateMany({
      where: { id: { in: due.map((n) => n.id) } },
      data: { remindedAt: new Date() },
    });
  }

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return NextResponse.json({ items, unread });
}

export async function PATCH(req: Request) {
  const session = await getSafeSession();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { id, all } = await req.json().catch(() => ({}));
  if (all) {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  } else if (id) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  }
  return NextResponse.json({ ok: true });
}
