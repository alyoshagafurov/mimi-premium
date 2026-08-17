import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isStaff, ROLE_LABEL } from '@/lib/roles';
import { PageHeader } from '@/components/admin/PageHeader';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { Role } from '@prisma/client';

/** Команда: профиль каждого сотрудника виден всем остальным сотрудникам. */
export default async function AdminPeoplePage() {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!isStaff(me?.role)) redirect('/admin');

  const people = await prisma.user.findMany({
    where: { role: { not: 'CLIENT' }, approvedAt: { not: null } },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, avatar: true, jobTitle: true, bio: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title={<>Команда</>}
        subtitle="Профили коллег: кто чем занимается и как связаться."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-brand-lime/25"
          >
            <div className="flex items-center gap-4">
              <UserAvatar name={p.name} avatar={p.avatar} size={56} />
              <div className="min-w-0">
                <div className="truncate font-display text-lg font-bold text-light">
                  {p.name}
                  {p.id === me.id && <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-brand-lime">это вы</span>}
                </div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-brand-orange">
                  {p.jobTitle || ROLE_LABEL[p.role as Role]}
                </div>
              </div>
            </div>

            {p.bio && <p className="mt-4 whitespace-pre-wrap text-[13px] leading-relaxed text-light/65">{p.bio}</p>}

            <div className="mt-4 space-y-1 border-t border-white/[0.05] pt-4 text-[12px]">
              <div className="truncate text-light/55">{p.email}</div>
              {p.phone && <a href={`tel:${p.phone}`} className="block font-mono text-brand-lime">{p.phone}</a>}
              {p.jobTitle && (
                <div className="text-[11px] text-light/35">{ROLE_LABEL[p.role as Role]}</div>
              )}
            </div>
          </div>
        ))}
        {people.length === 0 && (
          <p className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-light/45 sm:col-span-2 lg:col-span-3">
            Пока нет сотрудников.
          </p>
        )}
      </div>
    </div>
  );
}
