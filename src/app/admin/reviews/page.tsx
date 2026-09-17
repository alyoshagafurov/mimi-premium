import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isAdminLike } from '@/lib/roles';
import { ReviewsClient } from './ReviewsClient';

export default async function AdminReviewsPage() {
  const session = await getSafeSession();
  if (!isAdminLike((session?.user as any)?.role)) redirect('/admin');

  const reviews = await prisma.testimonial.findMany({
    orderBy: [{ createdAt: 'desc' }],
    take: 500,
    select: {
      id: true, name: true, company: true, position: true, photo: true,
      rating: true, text: true, published: true, fromSite: true, createdAt: true,
    },
  });

  return <ReviewsClient initial={reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />;
}
