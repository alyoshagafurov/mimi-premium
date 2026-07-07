import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

marked.setOptions({ breaks: true, gfm: true });

async function getPost(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPost(params.slug);
  if (!p) return { title: 'Статья не найдена', robots: { index: false, follow: true } };
  const title = p.seoTitle || p.title;
  const description = p.seoDescription || p.excerpt || p.content.replace(/[#*_`>]/g, '').slice(0, 160);
  const url = `${SITE_URL}/blog/${p.slug}`;
  const images = p.ogImage || p.cover ? [{ url: (p.ogImage || p.cover) as string }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title,
      description,
      images,
      publishedTime: p.date.toISOString(),
      authors: [p.author],
    },
    twitter: { card: 'summary_large_image', title, description, images: images?.map((i) => i.url) },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const p = await getPost(params.slug);
  if (!p) notFound();

  const [related, html] = await Promise.all([
    prisma.blogPost.findMany({ where: { published: true, category: p.category, NOT: { id: p.id } }, orderBy: { date: 'desc' }, take: 3 }),
    marked.parse(p.content || ''),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.seoDescription || p.excerpt || undefined,
    image: p.ogImage || p.cover || undefined,
    datePublished: p.date.toISOString(),
    dateModified: p.updatedAt.toISOString(),
    articleSection: p.category,
    author: { '@type': 'Organization', name: p.author || SITE_NAME },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`,
  };

  return (
    <div className="relative min-h-screen">
      <TopNav />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="relative z-10 mx-auto max-w-[760px] px-5 pb-24 pt-32 lg:px-6">
        <Breadcrumbs
          items={[
            { name: 'Главная', path: '/' },
            { name: 'Блог', path: '/blog' },
            { name: p.title, path: `/blog/${p.slug}` },
          ]}
        />
        <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-brand-orange">
          <span>{p.category}</span>
          <span className="text-light/40">· {formatDate(p.date)}</span>
          <span className="text-light/40">· {p.author}</span>
        </div>
        <h1 className="mt-4 font-display text-hero-sm font-extrabold leading-[1.08] text-light">{p.title}</h1>

        {p.cover && (
          <div className="mt-8 overflow-hidden rounded-3xl border border-white/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.cover} alt={p.title} className="w-full object-cover" loading="eager" decoding="async" />
          </div>
        )}

        {/* eslint-disable-next-line react/no-danger */}
        <article className="prose-mimi mt-10" dangerouslySetInnerHTML={{ __html: html }} />

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-brand-lime/20 bg-brand-lime/[0.03] p-8">
          <p className="font-display text-lg font-bold text-light">Нужен маркетинг под ключ?</p>
          <a href="https://wa.me/992070217755" target="_blank" rel="noreferrer" className="btn-lime">Получить аудит</a>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-extrabold text-light">Похожие статьи</h2>
            <div className="mt-6 space-y-3">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-ink2/30 px-5 py-4 transition-colors hover:border-brand-lime/30">
                  <span className="font-display text-base font-bold text-light group-hover:text-brand-lime">{r.title}</span>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-brand-lime">→</span>
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
