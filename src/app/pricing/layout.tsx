import { pageMetadata } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata({
  path: '/pricing',
  title: 'Тарифы и цены на маркетинг в Душанбе',
  description:
    'Тарифы маркетингового агентства mimi в Душанбе: таргетированная реклама, SMM, брендинг, Meta Ads. PRO, STANDART и ELITE — от 5 000 сомони в месяц. Подбираем пакет под цели и бюджет бизнеса.',
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Главная', path: '/' }, { name: 'Тарифы', path: '/pricing' }]} />
      {children}
    </>
  );
}
