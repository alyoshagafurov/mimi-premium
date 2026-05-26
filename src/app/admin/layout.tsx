import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Sidebar, MobileTopbar, MobileTabs } from '@/components/admin/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login?callbackUrl=/admin');
  if ((session.user as any).role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 grid-dots opacity-30" />
        <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-brand-purpleLight/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-brand-lime/5 blur-3xl" />
      </div>
      <MobileTopbar name={session.user.name ?? 'Admin'} />
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-4 lg:px-6">
        <Sidebar name={session.user.name ?? 'Admin'} />
        <div className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</div>
      </div>
      <MobileTabs />
    </div>
  );
}
