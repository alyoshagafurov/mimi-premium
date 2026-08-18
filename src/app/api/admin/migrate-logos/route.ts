import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Разовый перенос логотипов проектов из базы в Vercel Blob.
 *
 * Логотипы лежали в Client.logo строками base64 — 16 МБ на 48 записей, и
 * страница «Клиенты» тащила их целиком при каждой загрузке. Здесь мы
 * перекладываем картинки в Blob, а в базе оставляем короткую ссылку.
 *
 * Запускается на Vercel, где есть BLOB_READ_WRITE_TOKEN и быстрый доступ к БД,
 * поэтому 16 МБ никуда не едут по медленному каналу.
 *
 * Безопасность данных:
 *   • старое значение сохраняется в logoLegacy и НЕ удаляется — откат возможен;
 *   • обрабатываются только записи с `data:` — повторный запуск ничего не портит;
 *   • ошибка на одной записи не останавливает остальные.
 */
function parseDataUri(uri: string): { buf: Buffer; mime: string; ext: string } | null {
  const m = uri.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!m) return null;
  const mime = m[1] || 'image/png';
  const isB64 = !!m[2];
  const buf = isB64 ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]), 'utf8');
  if (!buf.length) return null;
  const ext = (mime.split('/')[1] || 'png').replace('+xml', '').replace('jpeg', 'jpg');
  return { buf, mime, ext };
}

export async function POST() {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN не задан' }, { status: 400 });
  }

  const { put } = await import('@vercel/blob');

  const targets = await prisma.client.findMany({
    where: { logo: { startsWith: 'data:' } },
    select: { id: true, businessName: true, logo: true },
  });

  const done: { name: string; kb: number; url: string }[] = [];
  const failed: { name: string; reason: string }[] = [];
  let freedBytes = 0;

  for (const c of targets) {
    try {
      const parsed = parseDataUri(c.logo!);
      if (!parsed) { failed.push({ name: c.businessName, reason: 'не разобрал data:' }); continue; }

      const slug = c.businessName.toLowerCase().replace(/[^a-z0-9а-я]+/gi, '-').slice(0, 40) || 'logo';
      const blob = await put(`logos/${slug}-${c.id}.${parsed.ext}`, parsed.buf, {
        access: 'public',
        contentType: parsed.mime,
        addRandomSuffix: true,
      });

      await prisma.client.update({
        where: { id: c.id },
        // Старое значение сохраняем — чистим отдельным шагом после проверки.
        data: { logo: blob.url, logoLegacy: c.logo },
      });

      freedBytes += c.logo!.length;
      done.push({ name: c.businessName, kb: Math.round(parsed.buf.length / 1024), url: blob.url });
    } catch (e: any) {
      failed.push({ name: c.businessName, reason: (e?.message ?? 'ошибка').slice(0, 120) });
    }
  }

  if (done.length) {
    await logAudit({
      action: 'updated',
      entity: 'client',
      summary: `Логотипы перенесены в Blob: ${done.length} шт (${Math.round(freedBytes / 1024 / 1024)} МБ)`,
    });
  }

  return NextResponse.json({
    ok: failed.length === 0,
    перенесено: done.length,
    ошибок: failed.length,
    освободится_после_очистки_МБ: Math.round((freedBytes / 1024 / 1024) * 10) / 10,
    подробности: done,
    ошибки: failed,
  });
}

/** Что сейчас в базе — можно посмотреть до и после переноса. */
export async function GET() {
  if (!(await ensureAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [base64, blob, legacy] = await Promise.all([
    prisma.client.count({ where: { logo: { startsWith: 'data:' } } }),
    prisma.client.count({ where: { logo: { startsWith: 'http' } } }),
    prisma.client.count({ where: { logoLegacy: { not: null } } }),
  ]);
  return NextResponse.json({
    логотипов_в_base64: base64,
    логотипов_ссылками: blob,
    сохранённых_копий_legacy: legacy,
  });
}
