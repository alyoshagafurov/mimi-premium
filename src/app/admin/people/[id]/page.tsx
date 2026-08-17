import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isStaff, ROLE_LABEL } from '@/lib/roles';
import { UserAvatar } from '@/components/ui/UserAvatar';
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
    <div className="space-y-6">
      <Link href="/admin/people" className="text-xs uppercase tracking-[0.18em] text-light/45 hover:text-brand-lime">
        ← Команда
      </Link>

      <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02]">
        {/* Обложка: если её нет — мягкий фирменный градиент */}
        <div className="relative h-40 w-full sm:h-56">
          {p.banner ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.banner} alt="" className="h-full w-full object-cover" />
              {/* Затемнение снизу — даёт глубину и отделяет обложку от карточки */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink2 via-ink2/25 to-transparent" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-purple/35 via-ink2 to-brand-lime/10" />
          )}
        </div>

        {/* Аватар «выезжает» на обложку */}
        <div className="px-6 pb-7">
          <div className="-mt-12 flex flex-wrap items-end gap-4 sm:-mt-14">
            <div className="rounded-full ring-4 ring-ink2">
              <UserAvatar name={p.name} avatar={p.avatar} size={96} />
            </div>
            <div className="min-w-0 flex-1 pb-1">
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
    </div>
  );
}
