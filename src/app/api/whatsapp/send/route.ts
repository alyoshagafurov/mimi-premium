import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureStaff } from '@/lib/api-guard';
import { rateLimit } from '@/lib/rate-limit';
import { sendText, whatsappSendEnabled, insideServiceWindow } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const schema = z.object({
  conversationId: z.string().min(1),
  text: z.string().trim().min(1).max(4096),
});

/** Ответ клиенту из CRM. Сообщение уходит только через официальный Cloud API. */
export async function POST(req: Request) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as { id: string; name?: string | null };

  const limit = await rateLimit(`wa-send:${me.id}`, 60, 60_000);
  if (!limit.ok) return NextResponse.json({ error: 'Слишком часто — подождите минуту' }, { status: 429 });

  if (!whatsappSendEnabled) {
    return NextResponse.json(
      { error: 'WhatsApp не настроен: нужны WHATSAPP_ACCESS_TOKEN и WHATSAPP_PHONE_NUMBER_ID' },
      { status: 503 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Введите текст сообщения' }, { status: 400 });
  const { conversationId, text } = parsed.data;

  const convo = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, waId: true, lastInboundAt: true },
  });
  if (!convo) return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 });

  if (!insideServiceWindow(convo.lastInboundAt)) {
    return NextResponse.json(
      {
        error:
          'Прошло больше 24 часов с последнего сообщения клиента. ' +
          'Meta разрешает писать первым только заранее одобренным шаблоном — обычный текст будет отклонён.',
      },
      { status: 409 },
    );
  }

  const result = await sendText(convo.waId, text);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.retryable ? 503 : 502 });
  }

  const message = await prisma.whatsAppMessage.create({
    data: {
      conversationId: convo.id,
      wamid: result.wamid,
      direction: 'OUT',
      type: 'text',
      body: text,
      status: 'SENT',
      senderId: me.id,
    },
    select: { id: true, body: true, status: true, sentAt: true },
  });

  await prisma.whatsAppConversation.update({
    where: { id: convo.id },
    data: { lastMessageAt: message.sentAt, lastText: text.slice(0, 280), unread: 0 },
  });

  return NextResponse.json({
    id: message.id,
    direction: 'OUT',
    body: message.body,
    status: message.status,
    sentAt: message.sentAt.toISOString(),
    senderName: me.name ?? null,
  });
}
