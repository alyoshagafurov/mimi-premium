import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/PageHeader';
import { COLLECTIONS } from '@/lib/cms-collections';

export default async function ContentHubPage() {
  // counts for the two page-types + each collection
  const [cases, posts, counts] = await Promise.all([
    prisma.case.count(),
    prisma.blogPost.count(),
    Promise.all(COLLECTIONS.map((c) => (prisma as any)[c.model].count())),
  ]);

  const cards = [
    { key: 'cases', label: 'Кейсы', href: '/admin/cases', count: cases, eyebrow: 'Портфолио' },
    { key: 'blog', label: 'Блог', href: '/admin/blog', count: posts, eyebrow: 'Статьи' },
    ...COLLECTIONS.map((c, i) => ({ key: c.key, label: c.label, href: `/admin/content/${c.key}`, count: counts[i], eyebrow: c.eyebrow })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="CMS" title={<>Контент сайта</>} subtitle="Управляйте всеми публичными разделами: кейсы, блог, отзывы, команда, клиенты и др." />
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
    </div>
  );
}
