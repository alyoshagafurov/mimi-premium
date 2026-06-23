import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login?callbackUrl=/dashboard');
  if ((session.user as any).role === 'ADMIN') redirect('/admin');
  return (
    <div className="relative min-h-screen">
      <DashboardNav />
      <div className="pt-24 md:pt-20">{children}</div>
    </div>
  );
}
