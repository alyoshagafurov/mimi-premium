import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { uniqueSlug } from '@/lib/slug';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = await req.json();
  const data: any = {};
  for (const k of ['title', 'category', 'clientName', 'description', 'task', 'solution', 'result', 'seoTitle', 'seoDescription']) {
    if (k in b) data[k] = b[k];
  }
  if ('coverImage' in b) data.coverImage = b.coverImage || null;
  if ('ogImage' in b) data.ogImage = b.ogImage || null;
  if ('achievements' in b) data.achievements = Array.isArray(b.achievements) ? b.achievements.filter(Boolean) : [];
  if ('images' in b) data.images = Array.isArray(b.images) ? b.images : [];
  if ('date' in b) data.date = b.date ? new Date(b.date) : new Date();
  if ('published' in b) data.published = !!b.published;
  if ('sortOrder' in b) data.sortOrder = Number(b.sortOrder) || 0;
  if (b.slug) {
    data.slug = await uniqueSlug(b.slug, async (s) => {
      const found = await prisma.case.findUnique({ where: { slug: s } });
      return !!found && found.id !== params.id;
    });
  }
  const updated = await prisma.case.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: updated.id, slug: updated.slug });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await prisma.case.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
