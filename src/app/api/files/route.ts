import { NextResponse } from 'next/server';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — fits comfortably in Postgres + Vercel limits

// Allowlist of safe MIME types. Executable / script types are rejected to
// prevent stored malware. Files are always served with Content-Disposition:
// attachment, so even allowed types never execute in the browser.
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'application/zip',
  'video/mp4', 'video/quicktime', 'video/webm',
  'audio/mpeg', 'audio/wav',
]);

const ALLOWED_KINDS = new Set(['IMAGE', 'DOCUMENT', 'VIDEO', 'CREATIVE', 'BRANDBOOK', 'OTHER']);

function sanitizeName(name: string): string {
  const cleaned = (name || 'file')
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 200)
    .trim();
  return cleaned || 'file';
}

export async function GET(req: Request) {
  const session = await getSafeSession();
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
  const session = await getSafeSession();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const me = session.user as any;
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const requestedClient = form.get('clientId') as string | null;
  const rawKind = (form.get('kind') as string) ?? 'OTHER';
  const kind = ALLOWED_KINDS.has(rawKind) ? rawKind : 'OTHER';

  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: 'empty_file' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  }

  let clientId = requestedClient;
  if (me.role === 'CLIENT') {
    const c = await prisma.client.findUnique({ where: { ownerId: me.id }, select: { id: true } });
    if (!c) return NextResponse.json({ error: 'no_client' }, { status: 400 });
    clientId = c.id;
  } else {
    if (!clientId) return NextResponse.json({ error: 'no_client' }, { status: 400 });
    const exists = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: 'no_client' }, { status: 400 });
  }
  if (!clientId) return NextResponse.json({ error: 'no_client' }, { status: 400 });

  const safeName = sanitizeName(file.name);

  // Prefer Vercel Blob (scalable, off-DB) when configured; else fall back to a
  // base64 data URL stored in Postgres (fine for small files / early stage).
  let storedUrl: string;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`files/${clientId}/${Date.now()}-${safeName}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });
    storedUrl = blob.url;
  } else {
    const buf = Buffer.from(await file.arrayBuffer());
    storedUrl = `data:${file.type || 'application/octet-stream'};base64,${buf.toString('base64')}`;
  }

  const created = await prisma.file.create({
    data: {
      clientId,
      uploaderId: me.id,
      name: safeName,
      size: file.size,
      mime: file.type || null,
      url: storedUrl,
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
          body: `${c?.businessName ?? ''} · ${safeName}`,
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
        body: safeName,
        link: '/dashboard/files',
      });
    }
  }

  return NextResponse.json({ id: created.id });
}
