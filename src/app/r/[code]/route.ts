import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BRAND } from '@/lib/seo';
import { waLink } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * Короткая ссылка под публикацию: /r/<метка> → WhatsApp с предзаполненным
 * текстом, в котором лежит эта метка. Её и размещают в Instagram-био или в
 * стикере Stories — в подписи к Reels ссылки не кликабельны.
 *
 * Автоматические заходы предпросмотра ссылок кликами не считаем: иначе счётчик
 * растёт ещё до того, как человек вообще нажал.
 */
const PREVIEW_BOTS = /facebookexternalhit|WhatsApp\/|Twitterbot|TelegramBot|Slackbot|Discordbot|bot\b|crawler|spider|preview/i;

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const link = code
    ? await prisma.whatsAppLink.findUnique({ where: { code }, select: { id: true, code: true, active: true } })
    : null;

  // Неизвестная или выключенная метка — всё равно ведём человека в WhatsApp,
  // просто без отслеживания источника.
  if (!link || !link.active) {
    return NextResponse.redirect(BRAND.whatsapp, 302);
  }

  const ua = req.headers.get('user-agent') ?? '';
  if (!PREVIEW_BOTS.test(ua)) {
    await prisma.whatsAppLink
      .update({ where: { id: link.id }, data: { clicks: { increment: 1 } } })
      .catch(() => {});
  }

  return NextResponse.redirect(waLink(link.code), 302);
}
