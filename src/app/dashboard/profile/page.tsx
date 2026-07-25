import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { AvatarUploader } from '@/components/ui/AvatarUploader';

export default async function DashboardProfilePage() {
  const session = await getSafeSession();
  if (!session?.user) redirect('/auth/login?callbackUrl=/dashboard/profile');
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { name: true, email: true, phone: true, avatar: true },
  });
  if (!user) redirect('/auth/login');

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">Профиль</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-light sm:text-3xl">Мой профиль</h1>
      </div>

      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
        <label className="label-soft">Фото профиля</label>
        <div className="mt-2"><AvatarUploader name={user.name} avatar={user.avatar} /></div>

        <div className="mt-6 space-y-3 border-t border-white/[0.06] pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-light/45">Имя</span><span className="text-light/85">{user.name}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-light/45">Email</span><span className="text-light/85">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex justify-between gap-4">
              <span className="text-light/45">Телефон</span><span className="text-light/85">{user.phone}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
