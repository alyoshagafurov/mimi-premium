import { NextResponse } from 'next/server';
import { ensureStaff } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { mediaUrl } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * Отдать вложение из WhatsApp сотруднику. Файл у Meta скачивается только с
 * токеном, поэтому отдаём его через себя, а не редиректом: токен не должен
 * попасть в браузер.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await ensureStaff();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // Отдаём только те вложения, которые действительно есть в нашей переписке.
  const known = await prisma.whatsAppMessage.findFirst({
    where: { mediaId: params.id },
    select: { mediaMime: true },
  });
  if (!known) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const url = await mediaUrl(params.id);
  if (!url) return NextResponse.json({ error: 'Файл недоступен' }, { status: 502 });

  const file = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
    cache: 'no-store',
  });
  if (!file.ok || !file.body) return NextResponse.json({ error: 'Файл недоступен' }, { status: 502 });

  return new NextResponse(file.body, {
    headers: {
      'Content-Type': file.headers.get('content-type') ?? known.mediaMime ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=300',
    },
  });
}
