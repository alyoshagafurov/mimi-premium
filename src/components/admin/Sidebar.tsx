'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/admin', label: 'Дашборд' },
  { href: '/admin/clients', label: 'Клиенты' },
  { href: '/admin/campaigns', label: 'Кампании' },
  { href: '/admin/metrics', label: 'Метрики' },
  { href: '/admin/leads', label: 'Заявки' },
  { href: '/admin/settings', label: 'Настройки' },
];

export function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <aside className="glass-luxury sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-3xl p-7 lg:flex">
      <div className="flex items-end justify-between">
        <Logo size="md" />
        <span className="rounded-full border border-brand-lime/30 bg-brand-lime/5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-lime">
          admin os
        </span>
      </div>

      <nav className="mt-12 flex flex-1 flex-col gap-1">
        {ITEMS.map((it) => {
          const active = pathname === it.href || (it.href !== '/admin' && pathname.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'group relative flex items-center justify-between rounded-2xl px-4 py-3 text-[13px] transition-colors duration-300',
                active ? 'text-light' : 'text-light/55 hover:text-light',
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-active-pill"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 -z-10 rounded-2xl border border-brand-lime/30 bg-brand-lime/[0.05] shadow-[0_0_30px_rgba(212,236,76,0.18)]"
                />
              )}
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors duration-300',
                    active ? 'bg-brand-lime' : 'bg-light/15',
                  )}
                />
                <span className="font-medium">{it.label}</span>
              </span>
              <span className={cn('text-light/30 transition-all duration-300', active && 'text-brand-lime')}>→</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] pt-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-gradient font-display text-base font-extrabold text-ink">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-light">{name}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-light/45">Administrator</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full rounded-xl border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-light/55 transition-all hover:border-brand-lime/40 hover:text-brand-lime"
        >
          Выйти
        </button>
      </div>
    </aside>
  );
}

export function MobileTopbar({ name }: { name: string }) {
  return (
    <div className="glass-luxury sticky top-2 z-30 mx-2 mt-2 flex items-center justify-between rounded-2xl px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <Logo size="sm" />
        <span className="hidden rounded-full border border-brand-lime/30 bg-brand-lime/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-lime sm:inline">
          admin
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-gradient font-display text-[11px] font-extrabold text-ink">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden text-[11px] text-light/55 sm:block">{name}</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-light/55 transition-colors hover:border-brand-lime/40 hover:text-brand-lime"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  return (
    <div className="glass-luxury scrollbar-none fixed inset-x-3 bottom-3 z-40 flex items-stretch gap-1 overflow-x-auto rounded-2xl p-1.5 lg:hidden">
      {ITEMS.map((it) => {
        const active = pathname === it.href || (it.href !== '/admin' && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-all duration-300',
              active
                ? 'bg-brand-lime/[0.08] text-brand-lime shadow-[0_0_20px_-6px_rgba(212,236,76,0.55)]'
                : 'text-light/55 hover:text-light',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors duration-300',
                active ? 'bg-brand-lime' : 'bg-light/20',
              )}
            />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
