import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
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
  const session = await getServerSession(authOptions);
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
