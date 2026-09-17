import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { ReviewsView, type PublicReview } from './ReviewsView';

export const metadata: Metadata = pageMetadata({
  path: '/reviews',
  title: 'Отзывы клиентов — маркетинговое агентство mimi',
  description:
    'Отзывы клиентов маркетингового агентства mimi в Душанбе. Оцените нашу работу и оставьте свой отзыв — публикуем после проверки.',
});

async function loadReviews(): Promise<PublicReview[]> {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }],
      take: 120,
      select: { id: true, name: true, company: true, position: true, photo: true, rating: true, text: true, date: true },
    });
    return rows.map((r) => ({ ...r, rating: Math.min(5, Math.max(1, r.rating || 5)), date: r.date.toISOString() }));
  } catch {
    // База недоступна — форма всё равно работает, список покажет пустое состояние.
    return [];
  }
}

export default async function ReviewsPage() {
  const reviews = await loadReviews();
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <BreadcrumbJsonLd items={[{ name: 'Главная', path: '/' }, { name: 'Отзывы', path: '/reviews' }]} />
      <TopNav />
      <ReviewsView reviews={reviews} />
      <Footer />
    </div>
  );
}
