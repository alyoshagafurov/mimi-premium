import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSafeSession();
  if (!session?.user) redirect('/auth/login?callbackUrl=/dashboard');
  if ((session.user as any).role === 'ADMIN') redirect('/admin');
  return (
    <div className="relative min-h-screen">
      <DashboardNav />
      <div className="pt-24 md:pt-20">{children}</div>
    </div>
  );
}
