import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureStaff } from '@/lib/api-guard';
import { stripSourceTag, insideServiceWindow } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/** Переписка одного диалога + карточка клиента и история взаимодействий. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const convo = await prisma.whatsAppConversation.findUnique({
    relationLoadStrategy: 'join',
    where: { id: params.id },
    select: {
      id: true,
      phone: true,
      profileName: true,
      lastInboundAt: true,
      unread: true,
      messages: {
        orderBy: { sentAt: 'asc' },
        take: 300,
        select: {
          id: true, direction: true, type: true, body: true, mediaId: true, mediaMime: true,
          status: true, error: true, sentAt: true,
          sender: { select: { name: true } },
        },
      },
      client: {
        select: {
          id: true, contactName: true, businessName: true, niche: true, salesStatus: true,
          packageType: true, sourceType: true, sourceCampaign: true, sourceAdName: true,
          sourceRefCode: true, sourceClickId: true, sourceUrl: true, sourceNote: true,
          sourceConfirmed: true, firstContactAt: true, createdAt: true,
          assignees: { select: { name: true } },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: { id: true, body: true, createdAt: true, author: { select: { name: true } } },
          },
        },
      },
    },
  });
  if (!convo) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const client = convo.client;
  return NextResponse.json({
    id: convo.id,
    phone: convo.phone,
    profileName: convo.profileName,
    unread: convo.unread,
    // Вне 24-часового окна Meta пропускает только одобренные шаблоны.
    canReply: insideServiceWindow(convo.lastInboundAt),
    lastInboundAt: convo.lastInboundAt?.toISOString() ?? null,
    messages: convo.messages.map((m) => ({
      id: m.id,
      direction: m.direction,
      type: m.type,
      // Техническая метка источника в CRM не показывается; в базе текст остаётся как есть.
      body: stripSourceTag(m.body),
      mediaId: m.mediaId,
      mediaMime: m.mediaMime,
      status: m.status,
      error: m.error,
      sentAt: m.sentAt.toISOString(),
      senderName: m.sender?.name ?? null,
    })),
    client: client
      ? {
          id: client.id,
          contactName: client.contactName ?? client.businessName,
          businessName: client.businessName,
          niche: client.niche,
          salesStatus: client.salesStatus,
          packageType: client.packageType,
          sourceType: client.sourceType,
          sourceCampaign: client.sourceCampaign,
          sourceAdName: client.sourceAdName,
          sourceRefCode: client.sourceRefCode,
          sourceClickId: client.sourceClickId,
          sourceUrl: client.sourceUrl,
          sourceNote: client.sourceNote,
          sourceConfirmed: client.sourceConfirmed,
          firstContactAt: (client.firstContactAt ?? client.createdAt).toISOString(),
          assignees: client.assignees.map((a) => a.name),
          history: client.activities.map((a) => ({
            id: a.id,
            body: a.body,
            author: a.author?.name ?? 'Система',
            createdAt: a.createdAt.toISOString(),
          })),
        }
      : null,
  });
}

/** Отметить диалог прочитанным. */
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.whatsAppConversation.updateMany({ where: { id: params.id }, data: { unread: 0 } });
  return NextResponse.json({ ok: true });
}
