import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';
import { notify } from '@/lib/notify';

/**
 * Заметка от агентства клиенту: её пишет админ в карточке проекта, а клиент
 * видит у себя в кабинете. От внутренних заметок (Activity) отличается именно
 * этим — внутренние клиенту не показываются никогда.
 */
export async function POST(req: Request) {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;

  const body = await req.json().catch(() => ({}));
  const text = String(body.body ?? '').trim();
  const clientId = String(body.clientId ?? '');
  if (!text) return NextResponse.json({ error: 'Введите текст' }, { status: 400 });
  if (!clientId) return NextResponse.json({ error: 'Не указан проект' }, { status: 400 });

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { ownerId: true } });
  if (!client) return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });

  const message = await prisma.message.create({
    data: { clientId, senderId: me.id, body: text },
  });

  await notify({
    userId: client.ownerId,
    kind: 'MESSAGE',
    title: 'Сообщение от команды mimi',
    body: text.length > 120 ? `${text.slice(0, 120)}…` : text,
    link: '/dashboard',
  }).catch(() => {});

  return NextResponse.json(message);
}
