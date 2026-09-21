import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isAdminLike } from '@/lib/roles';
import { CasesClient } from './CasesClient';

export default async function AdminCasesPage() {
  const session = await getSafeSession();
  if (!isAdminLike((session?.user as any)?.role)) redirect('/admin');

  const cases = await prisma.case.findMany({
    orderBy: [{ published: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, slug: true, title: true, description: true, logo: true,
      coverImage: true, instagramUrl: true, published: true, images: true, logoRatio: true,
    },
  });

  return <CasesClient initial={cases} />;
}
