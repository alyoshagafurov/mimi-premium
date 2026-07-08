import { prisma } from '@/lib/prisma';
import { CmsAdminList } from '@/components/admin/CmsAdminList';

export default async function AdminCasesPage() {
  const cases = await prisma.case.findMany({ orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }] });
  return (
    <CmsAdminList
      resource="cases"
      basePath="/admin/cases"
      apiBase="/api/admin/cases"
      viewBase="/cases"
      eyebrow="CMS"
      title="Кейсы"
      subtitle="Портфолио агентства — публикуется на /cases с SEO и разметкой."
      newLabel="+ Кейс"
      col1="Категория"
      col2="Клиент"
      items={cases.map((c) => ({ id: c.id, title: c.title, slug: c.slug, published: c.published, meta1: c.category, meta2: c.clientName }))}
    />
  );
}
