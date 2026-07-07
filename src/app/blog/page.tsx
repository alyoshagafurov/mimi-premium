import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { pageMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = pageMetadata({
  path: '/blog',
  title: 'Блог о маркетинге — mimi, Душанбе',
  description:
    'Блог маркетингового агентства mimi: статьи о таргетированной рекламе, SMM, брендинге и Meta Ads в Душанбе и Таджикистане. Кейсы, советы и разборы для роста бизнеса.',
});

const PER_PAGE = 9;

export default async function BlogPage({ searchParams }: { searchParams: { q?: string; category?: string; page?: string } }) {
  const q = searchParams.q?.trim() || '';
  const category = searchParams.category?.trim() || null;
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  const where: any = { published: true };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [posts, total, cats] = await Promise.all([
    prisma.blogPost.findMany({ where, orderBy: { date: 'desc' }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({ where: { published: true }, select: { category: true }, distinct: ['category'] }),
  ]);
  const categories = cats.map((c) => c.category).filter(Boolean);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const buildHref = (patch: Record<string, string | number | null>) => {
    const p = new URLSearchParams();
    const merged = { q, category, page: undefined as any, ...patch };
    if (merged.q) p.set('q', String(merged.q));
    if (merged.category) p.set('category', String(merged.category));
    if (merged.page && Number(merged.page) > 1) p.set('page', String(merged.page));
    return `/blog${p.toString() ? `?${p}` : ''}`;
  };

  return (
    <div className="relative min-h-screen">
      <TopNav />
      <main className="relative z-10 mx-auto max-w-[1500px] px-5 pb-24 pt-32 lg:px-12">
        <Breadcrumbs items={[{ name: 'Главная', path: '/' }, { name: 'Блог', path: '/blog' }]} />
        <h1 className="mt-6 max-w-[16ch] font-display text-hero-sm font-extrabold text-light">
          Блог <span className="font-serif italic font-normal text-lime-grad">о маркетинге.</span>
        </h1>

        {/* Search + category filter */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form action="/blog" method="get" className="flex w-full max-w-md gap-2">
            {category && <input type="hidden" name="category" value={category} />}
            <input name="q" defaultValue={q} placeholder="Поиск по статьям…" className="input-glass" />
            <button type="submit" className="btn-ghost shrink-0">Найти</button>
          </form>
          <div className="flex flex-wrap gap-2">
            <Link href={buildHref({ category: null, page: 1 })} className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] ${!category ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light'}`}>Все</Link>
            {categories.map((c) => (
              <Link key={c} href={buildHref({ category: c, page: 1 })} className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] ${category === c ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light'}`}>{c}</Link>
            ))}
          </div>
        </div>

        {q && <p className="mt-6 text-sm text-light/45">Результаты по запросу «{q}»: {total}</p>}

        {posts.length === 0 ? (
          <p className="mt-16 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-light/50">Ничего не найдено.</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-ink2/30 transition-colors hover:border-brand-lime/30">
                <div className="aspect-[16/10] overflow-hidden bg-brand-purple/20">
                  {p.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover} alt={p.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-4xl font-extrabold text-brand-lime/30">mimi</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-brand-orange">
                    <span>{p.category}</span>
                    <span className="text-light/35">· {formatDate(p.date)}</span>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-extrabold leading-tight text-light group-hover:text-brand-lime">{p.title}</h2>
                  {p.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-light/55">{p.excerpt}</p>}
                  <span className="mt-auto pt-5 text-[11px] uppercase tracking-[0.2em] text-brand-lime">Читать →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={buildHref({ page: p })} className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${p === page ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light'}`}>{p}</Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
