import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdminLike } from '@/lib/api-guard';
import { uniqueSlug } from '@/lib/slug';
import { normalizeInstagramUrl, sanitizeImageList, sanitizeImageUrl, sanitizeRatio } from '@/lib/utils';

export async function POST(req: Request) {
  const admin = await ensureAdminLike();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
  const instagramUrl = normalizeInstagramUrl(b.instagramUrl);
  if (b.instagramUrl?.trim() && !instagramUrl) {
    return NextResponse.json({ error: 'Это не ссылка на Instagram' }, { status: 400 });
  }

  // Логотип и обложка тоже рисуются картинкой — принимаем только https или старые data:image.
  const logo = sanitizeImageUrl(b.logo);
  const coverImage = sanitizeImageUrl(b.coverImage);
  if ((b.logo && !logo) || (b.coverImage && !coverImage)) {
    return NextResponse.json({ error: 'Картинка должна быть загружена через админку' }, { status: 400 });
  }

  const slug = await uniqueSlug(b.slug?.trim() || b.title, async (s) => !!(await prisma.case.findUnique({ where: { slug: s } })));

  const created = await prisma.case.create({
    data: {
      title: b.title,
      slug,
      category: b.category ?? '',
      clientName: b.clientName ?? '',
      description: b.description ?? '',
      task: b.task ?? '',
      solution: b.solution ?? '',
      result: b.result ?? '',
      achievements: Array.isArray(b.achievements) ? b.achievements.filter(Boolean) : [],
      coverImage,
      logo,
      logoRatio: logo ? sanitizeRatio(b.logoRatio) : null,
      instagramUrl,
      images: sanitizeImageList(b.images),
      date: b.date ? new Date(b.date) : new Date(),
      seoTitle: b.seoTitle || null,
      seoDescription: b.seoDescription || null,
      ogImage: b.ogImage || null,
      published: !!b.published,
      sortOrder: Number(b.sortOrder) || 0,
    },
  });
  return NextResponse.json({ id: created.id, slug: created.slug });
}
