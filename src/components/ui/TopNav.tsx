'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './Logo';
import { LangSwitcher } from './LangSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

type NavItem = { href: string; label: string; n: string };

const ru = {
  nav: { home: 'Главная', services: 'Услуги', cases: 'Кейсы', pricing: 'Тарифы', faq: 'FAQ', contacts: 'Контакты' },
  cabinet: 'Кабинет',
  logout: 'Выйти',
  login: 'Вход',
  loginCabinet: 'Вход в кабинет',
  cta: 'Получить аудит',
  openCabinet: 'Открыть кабинет',
  loggedAs: 'Вы вошли как',
  menu: 'меню',
  openMenu: 'Открыть меню',
  closeMenu: 'Закрыть меню',
};
const en: typeof ru = {
  nav: { home: 'Home', services: 'Services', cases: 'Cases', pricing: 'Pricing', faq: 'FAQ', contacts: 'Contacts' },
  cabinet: 'Dashboard',
  logout: 'Sign out',
  login: 'Sign in',
  loginCabinet: 'Sign in',
  cta: 'Get an audit',
  openCabinet: 'Open dashboard',
  loggedAs: 'Signed in as',
  menu: 'menu',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
};
const tg: typeof ru = {
  nav: { home: 'Асосӣ', services: 'Хидматҳо', cases: 'Кейсҳо', pricing: 'Тарифҳо', faq: 'Саволҳо', contacts: 'Тамос' },
  cabinet: 'Кабинет',
  logout: 'Баромад',
  login: 'Воридшавӣ',
  loginCabinet: 'Ворид шудан',
  cta: 'Гирифтани аудит',
  openCabinet: 'Кушодани кабинет',
  loggedAs: 'Шумо ворид шудед ҳамчун',
  menu: 'меню',
  openMenu: 'Кушодани меню',
  closeMenu: 'Бастани меню',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export function TopNav({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const t = useCopy(COPY);

  const NAV: NavItem[] = [
    { href: '/', label: t.nav.home, n: '01' },
    { href: '/cases', label: t.nav.cases, n: '02' },
    { href: '/pricing', label: t.nav.pricing, n: '03' },
    { href: '/contacts', label: t.nav.contacts, n: '04' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while drawer is open + close on ESC
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

  const cabinHref = (session?.user as any)?.role === 'ADMIN' ? '/admin' : '/dashboard';

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled || !transparent
            ? 'border-b border-white/[0.06] bg-ink/70 backdrop-blur-2xl'
            : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-[68px] max-w-[1500px] items-center justify-between px-6 lg:px-10">
          <Logo size="md" />

          {/* Desktop nav */}
          <nav aria-label="Основная навигация" className="hidden items-center gap-9 text-[12px] uppercase tracking-[0.2em] text-light/65 md:flex">
            <Link href="/" className="transition-colors hover:text-brand-lime">{t.nav.home}</Link>
            <Link href="/cases" className="transition-colors hover:text-brand-lime">{t.nav.cases}</Link>
            <Link href="/pricing" className="transition-colors hover:text-brand-lime">{t.nav.pricing}</Link>
            <Link href="/contacts" className="transition-colors hover:text-brand-lime">{t.nav.contacts}</Link>
            {session?.user ? (
              <>
                <Link href={cabinHref} className="transition-colors hover:text-brand-lime">
                  {t.cabinet}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="transition-colors hover:text-brand-lime"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="transition-colors hover:text-brand-lime">{t.login}</Link>
                <a href="https://wa.me/992070217755" target="_blank" rel="noreferrer" className="btn-lime !px-5 !py-2 !text-[11px]">
                  {t.cta}
                </a>
              </>
            )}
            <ThemeToggle />
            <LangSwitcher />
          </nav>

          {/* Mobile burger */}
          <button
            type="button"
            aria-label={open ? t.closeMenu : t.openMenu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] transition-all duration-300 hover:border-brand-lime/50 hover:bg-brand-lime/[0.06] md:hidden"
          >
            {/* Lime glow ring on open */}
            <span
              className={cn(
                'pointer-events-none absolute inset-0 rounded-full transition-all duration-500',
                open
                  ? 'shadow-[0_0_30px_-4px_rgba(212,236,76,0.55)] ring-1 ring-brand-lime/60'
                  : 'shadow-none ring-0',
              )}
            />
            {/* Two bars that morph into X */}
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
      </header>

      {/* ─── MOBILE DRAWER ─── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label={t.closeMenu}
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[55] bg-ink/70 backdrop-blur-md md:hidden"
            />
            {/* Panel */}
            <motion.aside
              role="dialog"
              aria-modal
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-[60] flex w-[88%] max-w-sm flex-col overflow-hidden border-l border-white/[0.06] bg-gradient-to-br from-ink2/95 to-ink/95 backdrop-blur-2xl md:hidden"
            >
              {/* Ambient washes inside panel */}
              <div className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-brand-lime/[0.08] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-brand-purple/[0.25] blur-3xl" />
              <div className="pointer-events-none absolute inset-0 grid-dots opacity-30" />

              {/* Header row inside drawer (Logo + close-eyebrow) */}
              <div className="relative flex items-center justify-between px-6 pt-6">
                <Logo size="md" />
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand-orange">
                  {t.menu}
                </span>
              </div>
              <div className="relative mx-6 mt-5 h-px bg-gradient-to-r from-brand-lime/40 via-white/[0.06] to-transparent" />

              {/* Nav list */}
              <nav aria-label="Мобильное меню" className="relative mt-6 flex-1 overflow-y-auto px-6 pb-6">
                <ul className="space-y-1">
                  {NAV.map((it, i) => (
                    <motion.li
                      key={it.href}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.12 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={it.href}
                        onClick={() => setOpen(false)}
                        className="group flex items-baseline justify-between gap-4 py-4"
                      >
                        <span className="flex items-baseline gap-4 min-w-0">
                          <span className="font-mono text-[11px] tracking-[0.2em] text-brand-orange/70">
                            {it.n}
                          </span>
                          <span className="truncate font-display text-2xl font-extrabold tracking-tight text-light transition-colors duration-300 group-hover:text-brand-lime">
                            {it.label}
                          </span>
                        </span>
                        <span className="text-light/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-lime">
                          →
                        </span>
                      </Link>
                      <span className="block h-px w-full bg-white/[0.04]" />
                    </motion.li>
                  ))}
                </ul>

                {/* Cabinet / Auth area */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="mt-10 space-y-3"
                >
                  {session?.user ? (
                    <>
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-light/45">
                          {t.loggedAs}
                        </p>
                        <p className="mt-2 font-display text-base font-bold text-light">
                          {session.user.name ?? session.user.email}
                        </p>
                        <p className="text-[11px] text-light/40">{session.user.email}</p>
                      </div>
                      <Link
                        href={cabinHref}
                        onClick={() => setOpen(false)}
                        className="btn-lime w-full !py-3 !text-[11px]"
                      >
                        {t.openCabinet}
                      </Link>
                      <button
                        onClick={() => {
                          setOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="btn-ghost w-full !py-3 !text-[11px]"
                      >
                        {t.logout}
                      </button>
                    </>
                  ) : (
                    <>
                      <a
                        href="https://wa.me/992070217755"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setOpen(false)}
                        className="btn-lime w-full !py-3 !text-[11px]"
                      >
                        {t.cta}
                      </a>
                      <Link
                        href="/auth/login"
                        onClick={() => setOpen(false)}
                        className="btn-ghost w-full !py-3 !text-[11px]"
                      >
                        {t.loginCabinet}
                      </Link>
                    </>
                  )}
                </motion.div>

                {/* Footer micro-info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                  className="mt-10 space-y-2 border-t border-white/[0.05] pt-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <LangSwitcher className="w-max" />
                    <ThemeToggle />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-light/35">
                    mimi · marketing agency
                  </p>
                  <a
                    href={`tel:${process.env.NEXT_PUBLIC_BRAND_PHONE ?? '+992 07 021 77 55'}`}
                    className="block font-mono text-xs text-light/60 transition-colors hover:text-brand-lime"
                  >
                    {process.env.NEXT_PUBLIC_BRAND_PHONE ?? '+992 07 021 77 55'}
                  </a>
                  <a
                    href={`mailto:${process.env.NEXT_PUBLIC_BRAND_EMAIL ?? 'hello@mimi.agency.tj'}`}
                    className="block font-mono text-xs text-light/60 transition-colors hover:text-brand-lime"
                  >
                    {process.env.NEXT_PUBLIC_BRAND_EMAIL ?? 'hello@mimi.agency.tj'}
                  </a>
                </motion.div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
