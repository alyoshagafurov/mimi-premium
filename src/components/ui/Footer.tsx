import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-white/[0.06] bg-ink2/40 px-6 py-16 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo size="md" subtitle />
          <p className="mt-6 max-w-xs text-sm text-light/55">
            Minimise the noise. Maximise the impact. Маркетинг как система —
            не как эксперимент.
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">Агентство</p>
          <ul className="mt-4 space-y-3 text-sm text-light/75">
            <li><Link href="/#services" className="transition-colors hover:text-brand-lime">Услуги</Link></li>
            <li><Link href="/#cases" className="transition-colors hover:text-brand-lime">Кейсы</Link></li>
            <li><Link href="/#process" className="transition-colors hover:text-brand-lime">Процесс</Link></li>
            <li><Link href="/pricing" className="transition-colors hover:text-brand-lime">Тарифы</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">Кабинет</p>
          <ul className="mt-4 space-y-3 text-sm text-light/75">
            <li><Link href="/auth/login" className="transition-colors hover:text-brand-lime">Вход</Link></li>
            <li><Link href="/auth/register" className="transition-colors hover:text-brand-lime">Регистрация</Link></li>
            <li><Link href="/dashboard" className="transition-colors hover:text-brand-lime">Дашборд</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-brand-orange">Связь</p>
          <ul className="mt-4 space-y-3 text-sm text-light/75">
            <li><a href="tel:+992070217755" className="transition-colors hover:text-brand-lime">+992 07 021 77 55</a></li>
            <li><a href="https://instagram.com/mimi.agency.tj" className="transition-colors hover:text-brand-lime">mimi.agency.tj</a></li>
            <li><Link href="/contacts" className="transition-colors hover:text-brand-lime">Все контакты</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-[1500px] flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-8 text-[11px] uppercase tracking-[0.18em] text-light/40 md:flex-row">
        <span>© {year} mimi · minimise marketing agency</span>
        <span>Сделано с лаймовой пылью.</span>
      </div>
    </footer>
  );
}
