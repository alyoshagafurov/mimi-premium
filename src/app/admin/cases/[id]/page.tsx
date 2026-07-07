import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CaseForm } from '../CaseForm';

export default async function EditCasePage({ params }: { params: { id: string } }) {
  const c = await prisma.case.findUnique({ where: { id: params.id } });
  if (!c) notFound();
  return (
    <CaseForm
      initial={{
        id: c.id,
        title: c.title,
        slug: c.slug,
        category: c.category,
        clientName: c.clientName,
        description: c.description,
        task: c.task,
        solution: c.solution,
        result: c.result,
        achievements: c.achievements,
        coverImage: c.coverImage,
        images: c.images,
        date: c.date.toISOString().slice(0, 10),
        seoTitle: c.seoTitle ?? '',
        seoDescription: c.seoDescription ?? '',
        ogImage: c.ogImage,
        published: c.published,
        sortOrder: c.sortOrder,
      }}
    />
  );
}
