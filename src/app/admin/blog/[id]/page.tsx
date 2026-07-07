import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BlogForm } from '../BlogForm';

export default async function EditBlogPage({ params }: { params: { id: string } }) {
  const p = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!p) notFound();
  return (
    <BlogForm
      initial={{
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        cover: p.cover,
        excerpt: p.excerpt ?? '',
        content: p.content,
        author: p.author,
        date: p.date.toISOString().slice(0, 10),
        seoTitle: p.seoTitle ?? '',
        seoDescription: p.seoDescription ?? '',
        ogImage: p.ogImage,
        published: p.published,
      }}
    />
  );
}
