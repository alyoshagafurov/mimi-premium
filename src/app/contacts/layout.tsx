import { pageMetadata } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata({
  path: '/contacts',
  title: 'Контакты — маркетинговое агентство в Душанбе',
  description:
    'Свяжитесь с mimi — маркетинговое агентство полного цикла в Душанбе. Телефон, WhatsApp, Instagram. Таргетированная реклама, SMM, брендинг и Meta Ads в Таджикистане.',
});

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Главная', path: '/' }, { name: 'Контакты', path: '/contacts' }]} />
      {children}
    </>
  );
}
