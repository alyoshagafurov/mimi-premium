import { NextResponse } from 'next/server';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — avatars are small
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

/** Upload / change the current user's profile photo. Any signed-in user. */
export async function POST(req: Request) {
  const session = await getSafeSession();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const me = session.user as any;

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file || file.size === 0) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Файл больше 4 МБ' }, { status: 413 });
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Только изображения (jpg, png, webp, gif)' }, { status: 415 });
  }

  let url: string;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`avatars/${me.id}`, file, { access: 'public', addRandomSuffix: true });
    url = blob.url;
  } else {
    const buf = Buffer.from(await file.arrayBuffer());
    url = `data:${file.type || 'image/png'};base64,${buf.toString('base64')}`;
  }

  await prisma.user.update({ where: { id: me.id }, data: { avatar: url } });
  return NextResponse.json({ url });
}

/** Remove the photo — falls back to the name-letter avatar. */
export async function DELETE() {
  const session = await getSafeSession();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await prisma.user.update({ where: { id: (session.user as any).id }, data: { avatar: null } });
  return NextResponse.json({ ok: true });
}
