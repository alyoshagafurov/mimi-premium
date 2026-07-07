import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { uniqueSlug } from '@/lib/slug';

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

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
      coverImage: b.coverImage || null,
      images: Array.isArray(b.images) ? b.images : [],
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
