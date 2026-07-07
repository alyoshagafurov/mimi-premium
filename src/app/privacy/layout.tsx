import { pageMetadata } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata({
  path: '/privacy',
  title: 'Политика конфиденциальности',
  description:
    'Как маркетинговое агентство mimi в Душанбе собирает, использует и защищает персональные данные пользователей сайта и личного кабинета.',
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Главная', path: '/' }, { name: 'Конфиденциальность', path: '/privacy' }]} />
      {children}
    </>
  );
}
