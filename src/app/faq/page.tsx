import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { FaqJsonLd } from '@/components/seo/JsonLd';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/faq',
  title: 'Вопросы и ответы — mimi в Душанбе',
  description:
    'Частые вопросы о работе маркетингового агентства mimi в Душанбе: сроки запуска, гарантии, форматы сотрудничества, личный кабинет клиента и что входит в тарифы.',
});

/** Published FAQ from the CMS; empty on DB error → section falls back to built-in copy. */
async function loadFaqs(): Promise<{ question: string; answer: string }[]> {
  try {
    return await prisma.faq.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: { question: true, answer: true },
    });
  } catch {
    return [];
  }
}

export default async function FaqPage() {
  const faqs = await loadFaqs();

  return (
    <div className="relative min-h-screen">
      <FaqJsonLd />
      <TopNav />
      <main className="relative z-10">
        {/* Page hero */}
        <section className="mx-auto max-w-[1500px] px-5 pt-32 lg:px-12">
          <Breadcrumbs items={[{ name: 'Главная', path: '/' }, { name: 'FAQ', path: '/faq' }]} />
          <h1 className="mt-6 max-w-[18ch] font-display text-hero-sm font-extrabold text-light">
            Вопросы <span className="font-serif italic font-normal text-lime-grad">и ответы</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-light/55">
            Собрали то, что чаще всего спрашивают перед стартом: сроки, гарантии, форматы работы и что вы получаете
            в личном кабинете. Не нашли свой вопрос — напишите нам, ответим лично.
          </p>
        </section>

        {/* Full FAQ (CMS-driven, falls back to built-in copy) */}
        <FAQSection cmsFaqs={faqs} />

        {/* Conversion block */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
