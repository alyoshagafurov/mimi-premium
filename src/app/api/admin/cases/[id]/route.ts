import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';
import { uniqueSlug } from '@/lib/slug';
import { normalizeInstagramUrl, sanitizeImageList, sanitizeImageUrl, sanitizeRatio } from '@/lib/utils';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await ensureAdminLike();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = await req.json();
  const data: any = {};
  if ('logo' in b) {
    data.logo = sanitizeImageUrl(b.logo);
    if (b.logo && !data.logo) return NextResponse.json({ error: 'Картинка должна быть загружена через админку' }, { status: 400 });
    if (!data.logo) data.logoRatio = null;
  }
  if ('logoRatio' in b && data.logo !== null) data.logoRatio = sanitizeRatio(b.logoRatio);
  if ('instagramUrl' in b) {
    data.instagramUrl = normalizeInstagramUrl(b.instagramUrl);
    if (b.instagramUrl?.trim() && !data.instagramUrl) {
      return NextResponse.json({ error: 'Это не ссылка на Instagram' }, { status: 400 });
    }
  }
  for (const k of ['title', 'category', 'clientName', 'description', 'task', 'solution', 'result', 'seoTitle', 'seoDescription']) {
    if (k in b) data[k] = b[k];
  }
  if ('coverImage' in b) {
    data.coverImage = sanitizeImageUrl(b.coverImage);
    if (b.coverImage && !data.coverImage) return NextResponse.json({ error: 'Картинка должна быть загружена через админку' }, { status: 400 });
  }
  if ('ogImage' in b) data.ogImage = b.ogImage || null;
  if ('achievements' in b) data.achievements = Array.isArray(b.achievements) ? b.achievements.filter(Boolean) : [];
  if ('images' in b) data.images = sanitizeImageList(b.images);
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
  const admin = await ensureAdminLike();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await prisma.case.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
