import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

async function getCase(slug: string) {
  return prisma.case.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCase(params.slug);
  if (!c) return { title: 'Кейс не найден', robots: { index: false, follow: true } };
  const title = c.seoTitle || `${c.title} — кейс mimi`;
  const description = c.seoDescription || c.description.slice(0, 160);
  const url = `${SITE_URL}/cases/${c.slug}`;
  const images = c.ogImage || c.coverImage ? [{ url: (c.ogImage || c.coverImage) as string }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, siteName: SITE_NAME, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images: images?.map((i) => i.url) },
  };
}

export default async function CaseDetailPage({ params }: { params: { slug: string } }) {
  const c = await getCase(params.slug);
  if (!c) notFound();

  const related = await prisma.case.findMany({
    where: { published: true, category: c.category, NOT: { id: c.id } },
    orderBy: { date: 'desc' },
    take: 3,
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    headline: c.title,
    name: c.title,
    about: c.category,
    description: c.description,
    image: c.ogImage || c.coverImage || undefined,
    datePublished: c.date.toISOString(),
    dateModified: c.updatedAt.toISOString(),
    url: `${SITE_URL}/cases/${c.slug}`,
    author: { '@type': 'Organization', name: SITE_NAME, '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };

  const blocks = [
    { label: 'Задача', text: c.task },
    { label: 'Решение', text: c.solution },
    { label: 'Результат', text: c.result },
  ].filter((b) => b.text);

  return (
    <div className="relative min-h-screen">
      <TopNav />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="relative z-10 mx-auto max-w-[1000px] px-5 pb-24 pt-32 lg:px-8">
        <Breadcrumbs
          items={[
            { name: 'Главная', path: '/' },
            { name: 'Кейсы', path: '/cases' },
            { name: c.title, path: `/cases/${c.slug}` },
          ]}
        />

        <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-brand-orange">
          <span>{c.category}</span>
          {c.clientName && <span className="text-light/40">· {c.clientName}</span>}
          <span className="text-light/40">· {formatDate(c.date)}</span>
        </div>
        <h1 className="mt-4 font-display text-hero-sm font-extrabold leading-[1.05] text-light">{c.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-light/65">{c.description}</p>

        {c.coverImage && (
          <div className="mt-10 overflow-hidden rounded-3xl border border-white/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.coverImage} alt={c.title} className="w-full object-cover" loading="eager" decoding="async" />
          </div>
        )}

        {c.achievements.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {c.achievements.map((a, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <span className="mt-1 block text-sm leading-snug text-light/80">{a}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 space-y-10">
          {blocks.map((b) => (
            <section key={b.label}>
              <h2 className="font-display text-2xl font-extrabold text-brand-lime">{b.label}</h2>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.8] text-light/70">{b.text}</p>
            </section>
          ))}
        </div>

        {c.images.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {c.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`${c.title} — фото ${i + 1}`} loading="lazy" decoding="async" className="w-full rounded-2xl border border-white/[0.06] object-cover" />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-brand-lime/20 bg-brand-lime/[0.03] p-8">
          <p className="font-display text-xl font-bold text-light">Хотите такой же результат?</p>
          <a href="https://wa.me/992070217755" target="_blank" rel="noreferrer" className="btn-lime">Получить аудит</a>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-extrabold text-light">Похожие кейсы</h2>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} href={`/cases/${r.slug}`} className="group rounded-2xl border border-white/[0.06] bg-ink2/30 p-5 transition-colors hover:border-brand-lime/30">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-brand-orange">{r.category}</div>
                  <div className="mt-2 font-display text-base font-bold text-light group-hover:text-brand-lime">{r.title}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
