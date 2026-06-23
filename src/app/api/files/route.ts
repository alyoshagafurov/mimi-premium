import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — fits comfortably in Postgres + Vercel limits

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const me = session.user as any;
  const url = new URL(req.url);
  let clientId = url.searchParams.get('clientId');
  if (me.role === 'CLIENT') {
    const c = await prisma.client.findUnique({ where: { ownerId: me.id }, select: { id: true } });
    if (!c) return NextResponse.json({ files: [] });
    clientId = c.id;
  }
  if (!clientId) return NextResponse.json({ files: [] });
  const files = await prisma.file.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { name: true, role: true } } },
  });
  // strip data: URLs from list response for speed; only return metadata
  return NextResponse.json({
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      mime: f.mime,
      kind: f.kind,
      createdAt: f.createdAt,
      uploader: f.uploader,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const me = session.user as any;
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const requestedClient = form.get('clientId') as string | null;
  const kind = (form.get('kind') as string) ?? 'OTHER';

  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });

  let clientId = requestedClient;
  if (me.role === 'CLIENT') {
    const c = await prisma.client.findUnique({ where: { ownerId: me.id }, select: { id: true } });
    if (!c) return NextResponse.json({ error: 'no_client' }, { status: 400 });
    clientId = c.id;
  }
  if (!clientId) return NextResponse.json({ error: 'no_client' }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${buf.toString('base64')}`;

  const created = await prisma.file.create({
    data: {
      clientId,
      uploaderId: me.id,
      name: file.name,
      size: file.size,
      mime: file.type || null,
      url: dataUrl,
      kind: kind as any,
    },
  });

  // cross-notify
  if (me.role === 'CLIENT') {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    const c = await prisma.client.findUnique({ where: { id: clientId } });
    await Promise.all(
      admins.map((a) =>
        notify({
          userId: a.id,
          kind: 'SYSTEM',
          title: 'Клиент загрузил файл',
          body: `${c?.businessName ?? ''} · ${file.name}`,
          link: `/admin/clients/${clientId}`,
        }),
      ),
    );
  } else {
    const c = await prisma.client.findUnique({ where: { id: clientId }, include: { owner: true } });
    if (c?.owner) {
      await notify({
        userId: c.owner.id,
        kind: 'SYSTEM',
        title: 'Новый файл от агентства',
        body: file.name,
        link: '/dashboard/files',
      });
    }
  }

  return NextResponse.json({ id: created.id });
}
