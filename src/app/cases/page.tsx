import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/cases',
  title: 'Кейсы — результаты маркетинга в Душанбе',
  description:
    'Кейсы маркетингового агентства mimi в Душанбе: таргетированная реклама, SMM, брендинг и Meta Ads. Реальные результаты клиентов в Таджикистане — рост заявок, ROMI и продаж.',
});

const PER_PAGE = 9;

export default async function CasesPage({ searchParams }: { searchParams: { category?: string; page?: string } }) {
  const category = searchParams.category?.trim() || null;
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  const where = { published: true, ...(category ? { category } : {}) };
  const [cases, total, categoriesRaw] = await Promise.all([
    prisma.case.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }], skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    prisma.case.count({ where }),
    prisma.case.findMany({ where: { published: true }, select: { category: true }, distinct: ['category'] }),
  ]);
  const categories = categoriesRaw.map((c) => c.category).filter(Boolean);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const chip = (label: string, cat: string | null) => {
    const active = category === cat;
    const href = cat ? `/cases?category=${encodeURIComponent(cat)}` : '/cases';
    return (
      <Link
        key={label}
        href={href}
        className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
          active ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="relative min-h-screen">
      <TopNav />
      <main className="relative z-10 mx-auto max-w-[1500px] px-5 pb-24 pt-32 lg:px-12">
        <Breadcrumbs items={[{ name: 'Главная', path: '/' }, { name: 'Кейсы', path: '/cases' }]} />
        <h1 className="mt-6 max-w-[16ch] font-display text-hero-sm font-extrabold text-light">
          Кейсы <span className="font-serif italic font-normal text-lime-grad">и результаты.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-light/55">
          Реальные проекты агентства mimi в Душанбе и Таджикистане. Задача, решение, результат.
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          {chip('Все', null)}
          {categories.map((c) => chip(c, c))}
        </div>

        {cases.length === 0 ? (
          <p className="mt-16 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-light/50">
            Пока нет опубликованных кейсов.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-ink2/30 transition-colors hover:border-brand-lime/30"
              >
                <div className="aspect-[16/10] overflow-hidden bg-brand-purple/20">
                  {c.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.coverImage} alt={c.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-4xl font-extrabold text-brand-lime/30">mimi</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-brand-orange">
                    <span>{c.category}</span>
                    {c.clientName && <span className="text-light/35">· {c.clientName}</span>}
                  </div>
                  <h2 className="mt-3 font-display text-xl font-extrabold leading-tight text-light group-hover:text-brand-lime">{c.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-light/55">{c.description}</p>
                  <span className="mt-auto pt-5 text-[11px] uppercase tracking-[0.2em] text-brand-lime">Смотреть кейс →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
              const q = new URLSearchParams();
              if (category) q.set('category', category);
              if (p > 1) q.set('page', String(p));
              const href = `/cases${q.toString() ? `?${q}` : ''}`;
              return (
                <Link
                  key={p}
                  href={href}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
                    p === page ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light'
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
