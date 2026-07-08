import { prisma } from '@/lib/prisma';
import { CmsAdminList } from '@/components/admin/CmsAdminList';
import { formatDate } from '@/lib/utils';

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { date: 'desc' } });
  return (
    <CmsAdminList
      resource="blog"
      basePath="/admin/blog"
      apiBase="/api/admin/blog"
      viewBase="/blog"
      eyebrow="CMS"
      title="Блог"
      subtitle="Статьи публикуются на /blog с SEO, OG и разметкой Article."
      newLabel="+ Статья"
      col1="Категория"
      col2="Дата"
      items={posts.map((p) => ({ id: p.id, title: p.title, slug: p.slug, published: p.published, meta1: p.category, meta2: formatDate(p.date) }))}
    />
  );
}
