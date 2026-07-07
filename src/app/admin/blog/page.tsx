import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/PageHeader';
import { RowActions } from '@/components/admin/RowActions';
import { formatDate } from '@/lib/utils';

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { date: 'desc' } });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CMS"
        title={<>Блог</>}
        subtitle="Статьи публикуются на /blog с SEO, OG и разметкой Article."
        action={<Link href="/admin/blog/new" className="btn-lime">+ Статья</Link>}
      />

      <div className="overflow-hidden rounded-3xl border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.02] text-left text-[10px] uppercase tracking-[0.16em] text-light/45">
            <tr>
              <th className="px-4 py-3">Заголовок</th>
              <th className="hidden px-4 py-3 sm:table-cell">Категория</th>
              <th className="hidden px-4 py-3 md:table-cell">Дата</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-white/[0.04]">
                <td className="px-4 py-3">
                  <div className="font-medium text-light">{p.title}</div>
                  <div className="text-[11px] text-light/40">/blog/{p.slug}</div>
                </td>
                <td className="hidden px-4 py-3 text-light/60 sm:table-cell">{p.category || '—'}</td>
                <td className="hidden px-4 py-3 text-light/60 md:table-cell">{formatDate(p.date)}</td>
                <td className="px-4 py-3">
                  <RowActions apiBase="/api/admin/blog" id={p.id} editHref={`/admin/blog/${p.id}`} published={p.published} viewHref={`/blog/${p.slug}`} />
                </td>
              </tr>
            ))}
            {!posts.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-light/45">Пока нет статей.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
