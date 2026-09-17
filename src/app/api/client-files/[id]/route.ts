import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';
import { isBlobUrl } from '@/lib/utils';

/** Удалить PDF-отчёт: и строку в базе, и сам файл из Blob. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdminLike();
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const file = await prisma.file.findUnique({ where: { id: params.id }, select: { id: true, url: true } });
  if (!file) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await prisma.file.delete({ where: { id: params.id } });

  // Сначала база, потом хранилище: если Blob не ответит, отчёт всё равно
  // исчезнет из кабинета, а осиротевший файл никому не виден.
  if (isBlobUrl(file.url) && process.env.BLOB_READ_WRITE_TOKEN) {
    const { del } = await import('@vercel/blob');
    await del(file.url).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
