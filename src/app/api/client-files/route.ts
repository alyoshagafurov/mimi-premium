import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';
import { notify } from '@/lib/notify';
import { isBlobUrl, reportTitle } from '@/lib/utils';

/**
 * Записать загруженный PDF-отчёт за проектом. Сам файл к этому моменту уже
 * лежит в Blob (см. /api/client-files/upload) — здесь только строка в базе.
 */
export async function POST(req: Request) {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const me = session.user as any;

  const body = await req.json().catch(() => ({}));
  const clientId = String(body.clientId ?? '');
  const url = String(body.url ?? '');
  const size = Number(body.size) || 0;
  const month = Number(body.month);
  const year = Number(body.year);

  // Ссылку принимаем только на наш Blob — иначе в кабинет клиента можно было
  // бы подсунуть что угодно.
  if (!isBlobUrl(url)) return NextResponse.json({ error: 'Файл не из нашего хранилища' }, { status: 400 });
  if (!(month >= 1 && month <= 12) || !(year >= 2000 && year <= 2100)) {
    return NextResponse.json({ error: 'Укажите месяц и год отчёта' }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, ownerId: true } });
  if (!client) return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });

  const name = reportTitle(month, year);
  const file = await prisma.file.create({
    data: {
      clientId,
      uploaderId: me.id ?? null,
      name,
      url,
      size,
      mime: 'application/pdf',
      kind: 'DOCUMENT',
    },
  });

  await notify({
    userId: client.ownerId,
    kind: 'REPORT',
    title: 'Новый отчёт готов',
    body: `Отчёт за ${name.toLowerCase()} уже в вашем кабинете`,
    link: '/dashboard',
  }).catch(() => {});

  return NextResponse.json({
    id: file.id,
    name: file.name,
    url: file.url,
    size: file.size,
    createdAt: file.createdAt.toISOString(),
  });
}
