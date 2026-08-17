import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { Sidebar, MobileTopbar } from '@/components/admin/Sidebar';
import { isStaff } from '@/lib/roles';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSafeSession();
  if (!session?.user) redirect('/auth/login?callbackUrl=/admin');
  const role = (session.user as any).role as string;
  if (!isStaff(role)) redirect('/dashboard');
  // Аватар и имя приходят из токена — на каждый переход это минус один
  // поход в базу (а он стоит ~800 мс дороги до Вашингтона).
  const name = session.user.name ?? 'Admin';
  const avatar = ((session.user as any).avatar as string | null) ?? null;

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 grid-dots opacity-30" />
        <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-brand-purpleLight/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-brand-lime/5 blur-3xl" />
      </div>
      <MobileTopbar name={name} role={role} avatar={avatar} />
      <div className="mx-auto flex max-w-[1600px] gap-6 px-3 py-4 sm:px-4 lg:px-6">
        <Sidebar name={name} role={role} avatar={avatar} />
        <div className="min-w-0 flex-1 pb-6">{children}</div>
      </div>
    </div>
  );
}
