import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof b.folder === 'string' && b.folder.trim()) data.folder = b.folder.trim();
  if (typeof b.name === 'string' && b.name.trim()) data.name = b.name.trim();
  const updated = await prisma.mediaAsset.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const asset = await prisma.mediaAsset.findUnique({ where: { id: params.id } });
  if (!asset) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (process.env.BLOB_READ_WRITE_TOKEN && asset.url.startsWith('http')) {
    try {
      const { del } = await import('@vercel/blob');
      await del(asset.url);
    } catch {
      /* ignore blob delete errors */
    }
  }
  await prisma.mediaAsset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
