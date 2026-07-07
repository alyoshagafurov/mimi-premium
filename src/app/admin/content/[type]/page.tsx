import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCollection } from '@/lib/cms-collections';
import { CollectionManager } from '@/components/admin/CollectionManager';

export default async function CollectionAdminPage({ params }: { params: { type: string } }) {
  const col = getCollection(params.type);
  if (!col) notFound();

  const items = await (prisma as any)[col.model].findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  // Serialise Date objects → ISO strings for the client component.
  const serialised = JSON.parse(JSON.stringify(items));

  return <CollectionManager collection={col} initialItems={serialised} />;
}
