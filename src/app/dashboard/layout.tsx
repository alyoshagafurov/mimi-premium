import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { TopNav } from '@/components/ui/TopNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login?callbackUrl=/dashboard');
  if ((session.user as any).role === 'ADMIN') redirect('/admin');
  return (
    <div className="relative min-h-screen">
      <TopNav />
      <div className="pt-20">{children}</div>
    </div>
  );
}
