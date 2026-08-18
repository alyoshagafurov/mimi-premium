import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSafeSession();
  if (!session?.user) redirect('/auth/login?callbackUrl=/dashboard');
  if ((session.user as any).role === 'ADMIN') redirect('/admin');
  // Аватар только из базы: в токен его класть нельзя (см. lib/auth.ts).
  const me = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { name: true, avatar: true },
  });
  return (
    <div className="relative min-h-screen">
      <DashboardNav name={me?.name ?? session.user.name ?? ''} avatar={me?.avatar ?? null} />
      <div className="pt-24 md:pt-20">{children}</div>
    </div>
  );
}
