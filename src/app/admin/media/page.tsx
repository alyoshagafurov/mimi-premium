import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/PageHeader';
import { MediaLibrary } from '@/components/admin/MediaLibrary';

export default async function MediaPage() {
  const rows = await prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' }, take: 300 });
  const assets = JSON.parse(JSON.stringify(rows));
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Media" title={<>Медиатека</>} subtitle="Все загруженные изображения в одном месте: поиск, папки, повторное использование." />
      <MediaLibrary initialAssets={assets} />
    </div>
  );
}
