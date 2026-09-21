import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { pageMetadata } from '@/lib/seo';
import { CaseCard } from '@/components/cases/CaseCard';

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
  // База на Neon умеет засыпать, и одна неудачная попытка не должна превращать
  // страницу в ошибку 500 — показываем честное сообщение и рабочую навигацию.
  let dbDown = false;
  const [cases, total, categoriesRaw] = await Promise.all([
    prisma.case.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }], skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    prisma.case.count({ where }),
    prisma.case.findMany({ where: { published: true }, select: { category: true }, distinct: ['category'] }),
  ]).catch(() => {
    dbDown = true;
    return [[], 0, []] as [Awaited<ReturnType<typeof prisma.case.findMany>>, number, { category: string }[]];
  });
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
          Кейсы <span className="font-serif italic font-normal text-brand-lime">и результаты.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-light/55">
          Реальные проекты агентства mimi в Душанбе и Таджикистане. Задача, решение, результат.
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          {chip('Все', null)}
          {categories.map((c) => chip(c, c))}
        </div>

        {cases.length === 0 ? (
          <p className="mt-16 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-light/60">
            {dbDown
              ? 'Кейсы сейчас не загрузились — обновите страницу через минуту. Мы уже на связи в WhatsApp.'
              : 'Пока нет опубликованных кейсов.'}
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {cases.map((c, i) => (
              <CaseCard key={c.id} c={c} priority={i === 0} headingLevel="h2" />
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
