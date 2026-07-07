'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

const ru = {
  tagline: 'Маркетинг как система — не как эксперимент.',
  colAgency: 'Агентство',
  colCabinet: 'Кабинет',
  colContact: 'Связь',
  services: 'Услуги',
  cases: 'Кейсы',
  process: 'Процесс',
  pricing: 'Тарифы',
  login: 'Вход',
  register: 'Регистрация',
  dashboard: 'Дашборд',
  allContacts: 'Все контакты',
  madeWith: 'Сделано с лаймовой пылью.',
  privacy: 'Конфиденциальность',
  terms: 'Оферта',
};
const en: typeof ru = {
  tagline: 'Marketing as a system — not an experiment.',
  colAgency: 'Agency',
  colCabinet: 'Dashboard',
  colContact: 'Contact',
  services: 'Services',
  cases: 'Cases',
  process: 'Process',
  pricing: 'Pricing',
  login: 'Sign in',
  register: 'Sign up',
  dashboard: 'Dashboard',
  allContacts: 'All contacts',
  madeWith: 'Made with lime dust.',
  privacy: 'Privacy',
  terms: 'Terms',
};
const tg: typeof ru = {
  tagline: 'Маркетинг ҳамчун система — на ҳамчун таҷриба.',
  colAgency: 'Агентӣ',
  colCabinet: 'Кабинет',
  colContact: 'Тамос',
  services: 'Хидматҳо',
  cases: 'Кейсҳо',
  process: 'Раванд',
  pricing: 'Тарифҳо',
  login: 'Воридшавӣ',
  register: 'Бақайдгирӣ',
  dashboard: 'Кабинет',
  allContacts: 'Ҳамаи тамосҳо',
  madeWith: 'Бо чанги лиму сохта шудааст.',
  privacy: 'Махфият',
  terms: 'Оферта',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export function Footer() {
  const year = new Date().getFullYear();
  const t = useCopy(COPY);
  return (
    <footer className="relative border-t border-white/[0.06] bg-ink2/40 px-6 py-16 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo size="md" subtitle />
          <p className="mt-6 max-w-xs text-sm text-light/55">
            Minimise the noise. Maximise the impact. {t.tagline}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">{t.colAgency}</p>
          <ul className="mt-4 space-y-3 text-sm text-light/75">
            <li><Link href="/#services" className="transition-colors hover:text-brand-lime">{t.services}</Link></li>
            <li><Link href="/#cases" className="transition-colors hover:text-brand-lime">{t.cases}</Link></li>
            <li><Link href="/#process" className="transition-colors hover:text-brand-lime">{t.process}</Link></li>
            <li><Link href="/pricing" className="transition-colors hover:text-brand-lime">{t.pricing}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">{t.colCabinet}</p>
          <ul className="mt-4 space-y-3 text-sm text-light/75">
            <li><Link href="/auth/login" className="transition-colors hover:text-brand-lime">{t.login}</Link></li>
            <li><Link href="/auth/register" className="transition-colors hover:text-brand-lime">{t.register}</Link></li>
            <li><Link href="/dashboard" className="transition-colors hover:text-brand-lime">{t.dashboard}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">{t.colContact}</p>
          <ul className="mt-4 space-y-3 text-sm text-light/75">
            <li><a href="tel:+992070217755" className="transition-colors hover:text-brand-lime">+992 07 021 77 55</a></li>
            <li><a href="https://instagram.com/mimi.agency.tj" className="transition-colors hover:text-brand-lime">mimi.agency.tj</a></li>
            <li><Link href="/contacts" className="transition-colors hover:text-brand-lime">{t.allContacts}</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-[1500px] flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-8 text-[11px] uppercase tracking-[0.18em] text-light/40 md:flex-row">
        <span>© {year} mimi · minimise marketing agency</span>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="transition-colors hover:text-brand-lime">{t.privacy}</Link>
          <Link href="/terms" className="transition-colors hover:text-brand-lime">{t.terms}</Link>
          <span className="hidden md:inline">{t.madeWith}</span>
        </div>
      </div>
    </footer>
  );
}
