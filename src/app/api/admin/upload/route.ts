import { NextResponse } from 'next/server';
import { ensureStaff } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif']);

/** Admin-only image upload → stored + recorded in the Media Library. Returns { url, id }. */
export async function POST(req: Request) {
  const admin = await ensureStaff();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const folder = (form.get('folder') as string)?.trim() || 'Общее';
  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: 'empty' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  }

  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';

  /**
   * Картинки всегда идут в Blob. Раньше при отсутствии токена был молчаливый
   * откат в base64 прямо в БД — так в Client.logo и накопилось 16 МБ, из-за
   * чего страница «Клиенты» тащила их при каждой загрузке. Теперь без токена
   * загрузка честно падает с понятной ошибкой, а не портит базу незаметно.
   */
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Хранилище картинок не настроено (BLOB_READ_WRITE_TOKEN). Обратитесь к разработчику.' },
      { status: 503 },
    );
  }
  const { put } = await import('@vercel/blob');
  const blob = await put(`cms/${Date.now()}-${base}`, file, { access: 'public', addRandomSuffix: true });
  const url = blob.url;

  const asset = await prisma.mediaAsset.create({
    data: { url, name: file.name, folder, mime: file.type || null, size: file.size },
  });

  return NextResponse.json({ url, id: asset.id });
}
