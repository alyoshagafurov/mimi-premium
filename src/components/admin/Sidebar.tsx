'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/admin', label: 'Дашборд', n: '01' },
  { href: '/admin/clients', label: 'Клиенты', n: '02' },
  { href: '/admin/campaigns', label: 'Кампании', n: '03' },
  { href: '/admin/metrics', label: 'Метрики', n: '04' },
  { href: '/admin/leads', label: 'Заявки', n: '05' },
  { href: '/admin/settings', label: 'Настройки', n: '06' },
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pathname = usePathname();

  return (
    <>
      <div className="sticky top-0 z-30 mx-0 flex items-center justify-between border-b border-white/[0.06] bg-ink/80 px-4 py-3 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="hidden rounded-full border border-brand-lime/30 bg-brand-lime/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-lime sm:inline">
            admin
          </span>
        </div>
        <button
          type="button"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] transition-all duration-300 hover:border-brand-lime/50 hover:bg-brand-lime/[0.06]"
        >
          <span
            className={cn(
              'pointer-events-none absolute inset-0 rounded-full transition-all duration-500',
              open ? 'shadow-[0_0_30px_-4px_rgba(212,236,76,0.55)] ring-1 ring-brand-lime/60' : 'shadow-none ring-0',
            )}
          />
          <span className="relative block h-4 w-5">
            <motion.span
              animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'absolute left-0 top-0 block h-[1.5px] w-5 rounded-full transition-colors duration-300',
                open ? 'bg-brand-lime' : 'bg-light/85 group-hover:bg-brand-lime',
              )}
            />
            <motion.span
              animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0, width: 12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: open ? 20 : 12 }}
              className={cn(
                'absolute bottom-0 right-0 block h-[1.5px] rounded-full transition-colors duration-300',
                open ? 'bg-brand-lime' : 'bg-light/85 group-hover:bg-brand-lime',
              )}
            />
          </span>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Закрыть меню"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[55] bg-ink/70 backdrop-blur-md lg:hidden"
            />
            <motion.aside
              role="dialog"
              aria-modal
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-[60] flex w-[88%] max-w-sm flex-col overflow-hidden border-l border-white/[0.06] bg-gradient-to-br from-ink2/95 to-ink/95 backdrop-blur-2xl lg:hidden"
            >
              <div className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-brand-lime/[0.08] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-brand-purple/[0.25] blur-3xl" />
              <div className="pointer-events-none absolute inset-0 grid-dots opacity-30" />

              <div className="relative flex items-center justify-between px-6 pt-6">
                <Logo size="md" />
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand-orange">меню</span>
              </div>
              <div className="relative mx-6 mt-5 h-px bg-gradient-to-r from-brand-lime/40 via-white/[0.06] to-transparent" />

              <nav className="relative mt-6 flex-1 overflow-y-auto px-6 pb-6">
                <ul className="space-y-1">
                  {ITEMS.map((it, i) => {
                    const active = pathname === it.href || (it.href !== '/admin' && pathname.startsWith(it.href));
                    return (
                      <motion.li
                        key={it.href}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.12 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Link
                          href={it.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'group flex items-baseline justify-between gap-4 py-4',
                            active ? 'text-brand-lime' : 'text-light',
                          )}
                        >
                          <span className="flex items-baseline gap-4 min-w-0">
                            <span className={cn('font-mono text-[11px] tracking-[0.2em]', active ? 'text-brand-lime/70' : 'text-brand-orange/70')}>
                              {it.n}
                            </span>
                            <span className="truncate font-display text-xl font-extrabold tracking-tight transition-colors duration-300 group-hover:text-brand-lime">
                              {it.label}
                            </span>
                          </span>
                          <span className={cn('transition-all duration-300 group-hover:translate-x-1', active ? 'text-brand-lime' : 'text-light/30 group-hover:text-brand-lime')}>
                            →
                          </span>
                        </Link>
                        <span className="block h-px w-full bg-white/[0.04]" />
                      </motion.li>
                    );
                  })}
                </ul>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="mt-10 space-y-3"
                >
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-light/45">Администратор</p>
                    <p className="mt-2 font-display text-base font-bold text-light">{name}</p>
                    <p className="text-[11px] text-light/40">Admin Panel</p>
                  </div>
                  <button
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="btn-ghost w-full !py-3 !text-[11px]"
                  >
                    Выйти
                  </button>
                </motion.div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

