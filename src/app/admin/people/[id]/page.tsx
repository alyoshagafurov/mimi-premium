import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isStaff, ROLE_LABEL } from '@/lib/roles';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ProfileBanner } from './ProfileBanner';
import type { Role } from '@prisma/client';

/** Профиль сотрудника на весь экран: обложка, фото, должность, био, контакты. */
export default async function StaffProfilePage({ params }: { params: { id: string } }) {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!isStaff(me?.role)) redirect('/admin');

  const p = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      avatar: true, banner: true, jobTitle: true, bio: true, createdAt: true,
    },
  });
  if (!p || p.role === 'CLIENT') notFound();

  return (
    <div>
      <Link href="/admin/people" className="mb-5 inline-block text-xs uppercase tracking-[0.18em] text-light/45 hover:text-brand-lime">
        ← Команда
      </Link>

      {/* Обложка: прилипает и уходит ЗА карточку при скролле */}
      <ProfileBanner src={p.banner} />

      {/* Карточка профиля — непрозрачная и выше обложки, поэтому наползает на неё */}
      <div className="relative z-10 -mt-10 rounded-3xl border border-white/[0.06] bg-ink2 p-6 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.6)] sm:-mt-14 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar name={p.name} avatar={p.avatar} size={88} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold text-light sm:text-3xl">{p.name}</h1>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-brand-orange">
              {p.jobTitle || ROLE_LABEL[p.role as Role]}
            </p>
          </div>
          {p.id === me.id && (
            <Link href="/admin/settings" className="btn-ghost !px-5 !py-2 !text-[11px]">
              Редактировать профиль
            </Link>
          )}
        </div>

        {p.bio && (
          <p className="mt-6 max-w-2xl whitespace-pre-wrap text-[14px] leading-relaxed text-light/70">{p.bio}</p>
        )}

        <div className="mt-7 grid gap-4 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-light/35">Должность</div>
            <div className="mt-1 text-sm text-light/85">{ROLE_LABEL[p.role as Role]}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-light/35">Email</div>
            <a href={`mailto:${p.email}`} className="mt-1 block truncate text-sm text-brand-lime">{p.email}</a>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-light/35">Телефон</div>
            {p.phone ? (
              <a href={`tel:${p.phone}`} className="mt-1 block font-mono text-sm text-brand-lime">{p.phone}</a>
            ) : (
              <div className="mt-1 text-sm text-light/40">—</div>
            )}
          </div>
        </div>

        <p className="mt-6 text-[11px] text-light/30">
          В команде с {p.createdAt.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
