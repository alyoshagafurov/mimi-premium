import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';

/** List media assets with optional search + folder filter, plus the folder list. */
export async function GET(req: Request) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() || '';
  const folder = url.searchParams.get('folder')?.trim() || '';

  const where: any = {};
  if (folder) where.folder = folder;
  if (q) where.name = { contains: q, mode: 'insensitive' };

  const [assets, folderRows] = await Promise.all([
    prisma.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300 }),
    prisma.mediaAsset.findMany({ select: { folder: true }, distinct: ['folder'], orderBy: { folder: 'asc' } }),
  ]);

  return NextResponse.json({
    assets: assets.map((a) => ({ id: a.id, url: a.url, name: a.name, folder: a.folder, mime: a.mime, size: a.size, createdAt: a.createdAt })),
    folders: folderRows.map((f) => f.folder),
  });
}
