import type { Metadata } from 'next';
import Link from 'next/link';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { GuaranteesSection } from '@/components/landing/GuaranteesSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/services',
  title: 'Услуги — маркетинг полного цикла в Душанбе',
  description:
    'Услуги маркетингового агентства mimi в Душанбе: таргетированная реклама (Meta, Instagram, Facebook), контент-съёмка и Reels, маркетинговая стратегия, брендинг, графический дизайн, разработка сайтов и обучение системе продаж.',
});

export default function ServicesPage() {
  return (
    <div className="relative min-h-screen">
      <TopNav />
      <main className="relative z-10">
        {/* Page hero */}
        <section className="mx-auto max-w-[1500px] px-5 pt-32 lg:px-12">
          <Breadcrumbs items={[{ name: 'Главная', path: '/' }, { name: 'Услуги', path: '/services' }]} />
          <h1 className="mt-6 max-w-[18ch] font-display text-hero-sm font-extrabold text-light">
            Маркетинг <span className="font-serif italic font-normal text-lime-grad">под ключ</span> в&nbsp;Душанбе
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-light/55">
            Семь направлений, собранных в одну систему: от таргета и контента до стратегии, брендинга и сайтов.
            Подбираем состав работ под цели бизнеса, масштаб и бюджет — и связываем маркетинг с реальными продажами.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href="https://wa.me/992070217755" target="_blank" rel="noreferrer" className="btn-lime !px-6 !py-3 !text-[12px]">
              Получить аудит
            </a>
            <Link href="/pricing" className="btn-ghost !px-6 !py-3 !text-[12px]">
              Смотреть тарифы
            </Link>
          </div>
        </section>

        {/* Full services list (interactive) */}
        <ServicesSection />

        {/* How we work */}
        <ProcessSection />

        {/* Guarantees / why us */}
        <GuaranteesSection />

        {/* Conversion block */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
