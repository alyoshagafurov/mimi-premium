import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/PageHeader';
import { COLLECTIONS } from '@/lib/cms-collections';
import { formatDate } from '@/lib/utils';

export default async function ContentHubPage() {
  const [cases, posts, counts, recentCases, recentPosts] = await Promise.all([
    prisma.case.count(),
    prisma.blogPost.count(),
    Promise.all(COLLECTIONS.map((c) => (prisma as any)[c.model].count())),
    prisma.case.findMany({ where: { published: true }, orderBy: { updatedAt: 'desc' }, take: 4, select: { id: true, title: true, slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({ where: { published: true }, orderBy: { updatedAt: 'desc' }, take: 4, select: { id: true, title: true, slug: true, updatedAt: true } }),
  ]);

  const cards = [
    { key: 'cases', label: 'Кейсы', href: '/admin/cases', count: cases, eyebrow: 'Портфолио' },
    { key: 'blog', label: 'Блог', href: '/admin/blog', count: posts, eyebrow: 'Статьи' },
    ...COLLECTIONS.map((c, i) => ({ key: c.key, label: c.label, href: `/admin/content/${c.key}`, count: counts[i], eyebrow: c.eyebrow })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="CMS" title={<>Контент сайта</>} subtitle="Управляйте всеми публичными разделами: кейсы, блог, отзывы, команда, клиенты и др." />

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/cases/new" className="btn-lime">+ Кейс</Link>
        <Link href="/admin/blog/new" className="btn-ghost">+ Статья</Link>
        <Link href="/admin/media" className="btn-ghost">Медиатека</Link>
        <a href="/" target="_blank" rel="noreferrer" className="btn-ghost">Открыть сайт ↗</a>
      </div>

      {/* Section cards with counts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.key} href={c.href} className="group rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-brand-lime/30">
            <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">{c.eyebrow}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-extrabold text-light group-hover:text-brand-lime">{c.label}</h2>
              <span className="font-display text-2xl font-extrabold text-light/30">{c.count}</span>
            </div>
            <span className="mt-4 inline-block text-[11px] uppercase tracking-[0.18em] text-brand-lime">Управлять →</span>
          </Link>
        ))}
      </div>

      {/* Recently published */}
      {(recentCases.length > 0 || recentPosts.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {recentCases.length > 0 && (
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Последние кейсы</p>
              <div className="mt-4 space-y-2">
                {recentCases.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3">
                    <Link href={`/admin/cases/${c.id}`} className="truncate text-sm text-light hover:text-brand-lime">{c.title}</Link>
                    <div className="flex shrink-0 items-center gap-3 text-[11px] text-light/40">
                      <span>{formatDate(c.updatedAt)}</span>
                      <a href={`/cases/${c.slug}`} target="_blank" rel="noreferrer" className="hover:text-brand-lime">↗</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {recentPosts.length > 0 && (
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-[10px] uppercase tracking-[0.24em] text-brand-orange">Последние статьи</p>
              <div className="mt-4 space-y-2">
                {recentPosts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <Link href={`/admin/blog/${p.id}`} className="truncate text-sm text-light hover:text-brand-lime">{p.title}</Link>
                    <div className="flex shrink-0 items-center gap-3 text-[11px] text-light/40">
                      <span>{formatDate(p.updatedAt)}</span>
                      <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="hover:text-brand-lime">↗</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
