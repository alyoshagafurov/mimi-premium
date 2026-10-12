import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { pageMetadata } from '@/lib/seo';
import { CaseCard, type CaseCardData } from '@/components/cases/CaseCard';
import { CasesCarousel } from '@/components/cases/CasesCarousel';

export const metadata: Metadata = pageMetadata({
  path: '/cases',
  title: 'Кейсы — результаты маркетинга в Душанбе',
  description:
    'Кейсы маркетингового агентства mimi в Душанбе: таргетированная реклама, SMM, брендинг и Meta Ads. Реальные результаты клиентов в Таджикистане — рост заявок, ROMI и продаж.',
});

const PER_PAGE = 9;
/** Сколько кейсов крутится в карусели на входе: дальше — полный список. */
const IN_CAROUSEL = 12;

type CaseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string | null;
  logo: string | null;
  logoRatio: number | null;
  coverImage: string | null;
  images: string[];
  instagramUrl: string | null;
};

/** Карточке нужны только первые три фото — остальные считаются числом. */
const toCard = (c: CaseRow): CaseCardData => ({
  slug: c.slug,
  title: c.title,
  description: c.description,
  category: c.category,
  logo: c.logo,
  logoRatio: c.logoRatio,
  coverImage: c.coverImage,
  images: c.images.filter(Boolean).slice(0, 3),
  imagesCount: c.images.filter(Boolean).length,
  instagramUrl: c.instagramUrl,
});

/** «1 проект», «2 проекта», «5 проектов». */
const projectsWord = (n: number) => {
  const tens = n % 100;
  const ones = n % 10;
  if (tens >= 11 && tens <= 14) return 'проектов';
  if (ones === 1) return 'проект';
  if (ones >= 2 && ones <= 4) return 'проекта';
  return 'проектов';
};

const emptyNote = (dbDown: boolean) =>
  dbDown
    ? 'Кейсы сейчас не загрузились — обновите страницу через минуту. Мы уже на связи в WhatsApp.'
    : 'Пока нет опубликованных кейсов.';

export default async function CasesPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string; all?: string };
}) {
  // Без ?all — витрина-карусель; с ним — обычный список со всеми кейсами.
  return searchParams.all ? <AllCases searchParams={searchParams} /> : <CarouselView />;
}

/* ─────────────── Витрина: карусель ─────────────── */

async function CarouselView() {
  let dbDown = false;
  const [cases, total] = await Promise.all([
    prisma.case.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }],
      take: IN_CAROUSEL,
    }),
    prisma.case.count({ where: { published: true } }),
  ]).catch(() => {
    dbDown = true;
    return [[] as CaseRow[], 0] as const;
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <TopNav />
      <main className="relative z-10 pb-24 pt-32">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-12">
          <Breadcrumbs items={[{ name: 'Главная', path: '/' }, { name: 'Кейсы', path: '/cases' }]} />
          <h1 className="mt-6 max-w-[16ch] font-display text-hero-sm font-extrabold text-light">
            Кейсы <span className="font-serif italic font-normal text-brand-lime">и результаты.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-light/55">
            Реальные проекты агентства mimi в Душанбе и Таджикистане. Задача, решение, результат.
          </p>
        </div>

        {cases.length === 0 ? (
          <p className="mx-auto mt-16 max-w-[1500px] rounded-3xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-light/60">
            {emptyNote(dbDown)}
          </p>
        ) : (
          <>
            <div className="mt-8">
              <CasesCarousel cases={(cases as CaseRow[]).map(toCard)} />
            </div>

            <div className="mx-auto mt-10 max-w-[1500px] px-5 text-center lg:px-12">
              <p className="text-[12px] text-light/35">
                Листайте вбок — или нажмите на соседний кейс, чтобы вывести его в центр.
              </p>
              <Link href="/cases?all=1" className="btn-lime mt-8 !px-12 !py-5 !text-[13px]">
                Смотреть все кейсы
                {total > 0 && <span className="ml-2 opacity-60">{total}</span>}
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

/* ─────────────── Полный список ─────────────── */

async function AllCases({ searchParams }: { searchParams: { category?: string; page?: string } }) {
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
    return [[] as CaseRow[], 0, [] as { category: string }[]] as const;
  });
  const categories = categoriesRaw.map((c) => c.category).filter(Boolean);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  /** Ссылка внутри списка — вид «все кейсы» сохраняется. */
  const listHref = (params: { category?: string | null; page?: number }) => {
    const q = new URLSearchParams({ all: '1' });
    if (params.category) q.set('category', params.category);
    if (params.page && params.page > 1) q.set('page', String(params.page));
    return `/cases?${q}`;
  };

  const chip = (label: string, cat: string | null) => {
    const active = category === cat;
    return (
      <Link
        key={label}
        href={listHref({ category: cat })}
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
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <h1 className="max-w-[16ch] font-display text-hero-sm font-extrabold text-light">
            Все <span className="font-serif italic font-normal text-brand-lime">кейсы.</span>
          </h1>
          <Link href="/cases" className="text-[11px] uppercase tracking-[0.18em] text-light/45 transition-colors hover:text-brand-lime">
            ← Вернуться к витрине
          </Link>
        </div>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-light/55">
          {total > 0 ? `${total} ${projectsWord(total)} агентства mimi.` : 'Проекты агентства mimi.'} Задача, решение, результат.
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          {chip('Все', null)}
          {categories.map((c) => chip(c, c))}
        </div>

        {cases.length === 0 ? (
          <p className="mt-16 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-light/60">
            {emptyNote(dbDown)}
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {(cases as CaseRow[]).map((c, i) => (
              <CaseCard key={c.id} c={toCard(c)} priority={i === 0} headingLevel="h2" />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={listHref({ category, page: p })}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
                  p === page ? 'border-brand-lime/50 bg-brand-lime/[0.08] text-brand-lime' : 'border-white/10 text-light/55 hover:text-light'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
