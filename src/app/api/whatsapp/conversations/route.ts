import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureStaff } from '@/lib/api-guard';
import { whatsappSendEnabled } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/** Список диалогов для раздела WhatsApp. Поиск и фильтры — на стороне клиента. */
export async function GET() {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const items = await prisma.whatsAppConversation.findMany({
    relationLoadStrategy: 'join',
    orderBy: { lastMessageAt: 'desc' },
    take: 300,
    select: {
      id: true,
      waId: true,
      phone: true,
      profileName: true,
      lastMessageAt: true,
      lastText: true,
      unread: true,
      client: {
        select: {
          id: true,
          contactName: true,
          businessName: true,
          salesStatus: true,
          sourceType: true,
          sourceConfirmed: true,
        },
      },
    },
  });

  return NextResponse.json({
    sendEnabled: whatsappSendEnabled,
    unreadTotal: items.reduce((sum, c) => sum + c.unread, 0),
    items: items.map((c) => ({
      id: c.id,
      phone: c.phone,
      name: c.client?.contactName || c.profileName || c.phone,
      profileName: c.profileName,
      lastText: c.lastText ?? '',
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      unread: c.unread,
      clientId: c.client?.id ?? null,
      businessName: c.client?.businessName ?? null,
      salesStatus: c.client?.salesStatus ?? null,
      sourceType: c.client?.sourceType ?? null,
      sourceConfirmed: c.client?.sourceConfirmed ?? false,
    })),
  });
}
