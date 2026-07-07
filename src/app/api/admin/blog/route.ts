import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { uniqueSlug } from '@/lib/slug';

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: 'Заголовок обязателен' }, { status: 400 });

  const slug = await uniqueSlug(b.slug?.trim() || b.title, async (s) => !!(await prisma.blogPost.findUnique({ where: { slug: s } })));

  const created = await prisma.blogPost.create({
    data: {
      title: b.title,
      slug,
      category: b.category ?? '',
      cover: b.cover || null,
      excerpt: b.excerpt ?? '',
      content: b.content ?? '',
      author: b.author?.trim() || 'mimi',
      date: b.date ? new Date(b.date) : new Date(),
      seoTitle: b.seoTitle || null,
      seoDescription: b.seoDescription || null,
      ogImage: b.ogImage || null,
      published: !!b.published,
    },
  });
  return NextResponse.json({ id: created.id, slug: created.slug });
}
