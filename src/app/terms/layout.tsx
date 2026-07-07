import { pageMetadata } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata({
  path: '/terms',
  title: 'Публичная оферта',
  description:
    'Условия оказания маркетинговых услуг агентством mimi в Душанбе: тарифы, оплата, обязанности сторон и конфиденциальность.',
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Главная', path: '/' }, { name: 'Оферта', path: '/terms' }]} />
      {children}
    </>
  );
}
