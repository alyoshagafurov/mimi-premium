import { NextResponse } from 'next/server';
import { ensureAdmin } from '@/lib/api-guard';
import { slugify } from '@/lib/slug';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif']);

/** Admin-only image upload for CMS content. Returns { url }. */
export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: 'empty' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  }

  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`cms/${Date.now()}-${base}`, file, { access: 'public', addRandomSuffix: true });
    return NextResponse.json({ url: blob.url });
  }

  // Fallback: base64 data URL (works without external storage).
  const buf = Buffer.from(await file.arrayBuffer());
  const url = `data:${file.type || 'image/png'};base64,${buf.toString('base64')}`;
  return NextResponse.json({ url });
}
