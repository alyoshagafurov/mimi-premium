import { NextResponse } from 'next/server';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSafeSession();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const me = session.user as any;
  const file = await prisma.file.findUnique({ where: { id: params.id }, include: { client: true } });
  if (!file) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (me.role === 'CLIENT') {
    const c = await prisma.client.findUnique({ where: { ownerId: me.id } });
    if (!c || c.id !== file.clientId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  // data URL → decode and stream
  const m = file.url.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return NextResponse.redirect(file.url);
  const [, mime, b64] = m;
  const buf = Buffer.from(b64, 'base64');
  return new NextResponse(buf, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSafeSession();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const me = session.user as any;
  const file = await prisma.file.findUnique({ where: { id: params.id } });
  if (!file) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (me.role === 'CLIENT') {
    const c = await prisma.client.findUnique({ where: { ownerId: me.id } });
    if (!c || c.id !== file.clientId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  // Remove the underlying Blob object if the file lives in Vercel Blob.
  if (process.env.BLOB_READ_WRITE_TOKEN && file.url.startsWith('http')) {
    try {
      const { del } = await import('@vercel/blob');
      await del(file.url);
    } catch (err) {
      console.error('[files] blob delete failed', err);
    }
  }
  await prisma.file.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
