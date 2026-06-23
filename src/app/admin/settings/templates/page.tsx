import { prisma } from '@/lib/prisma';
import { TemplatesClient } from './TemplatesClient';

export default async function TemplatesPage() {
  const templates = await prisma.taskTemplate.findMany({
    include: { items: { orderBy: { position: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return (
    <TemplatesClient
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description ?? '',
        items: t.items.map((it) => ({
          id: it.id,
          title: it.title,
          offsetDays: it.offsetDays,
          priority: it.priority,
        })),
      }))}
    />
  );
}
