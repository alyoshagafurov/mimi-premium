'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Logo } from '@/components/ui/Logo';
import { NotificationsBell } from '@/components/ui/NotificationsBell';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/dashboard', label: 'Обзор' },
  { href: '/dashboard/files', label: 'Файлы' },
  { href: '/dashboard/invoices', label: 'Счета' },
  { href: '/dashboard/profile', label: 'Профиль' },
];

export function DashboardNav({ name: propName, avatar }: { name?: string; avatar?: string | null } = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = propName ?? session?.user?.name ?? '';
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-ink/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard"><Logo size="sm" /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            {ITEMS.map((it) => {
              const active = pathname === it.href || (it.href !== '/dashboard' && pathname.startsWith(it.href));
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-[13px] transition-colors',
                    active
                      ? 'bg-brand-lime/10 text-brand-lime'
                      : 'text-light/55 hover:text-light',
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <Link
            href="/"
            className="hidden rounded-xl border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-light/55 transition hover:border-brand-lime/40 hover:text-brand-lime sm:inline-flex"
          >
            Главная
          </Link>
          <Link href="/dashboard/profile" className="hidden h-9 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 transition hover:border-brand-lime/40 lg:flex">
            <UserAvatar name={name} avatar={avatar} size={24} />
            <span className="text-[12px] text-light/80">{name.split(' ')[0]}</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="rounded-xl border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-light/55 transition hover:border-brand-lime/40 hover:text-brand-lime"
          >
            Выйти
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <div className="border-t border-white/[0.04] px-4 py-2 md:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {ITEMS.map((it) => {
            const active = pathname === it.href || (it.href !== '/dashboard' && pathname.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] transition-colors',
                  active ? 'bg-brand-lime/10 text-brand-lime' : 'text-light/55',
                )}
              >
                {it.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
