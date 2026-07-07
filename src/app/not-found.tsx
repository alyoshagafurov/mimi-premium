import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'Страница не найдена',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[70vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/20 blur-3xl" />
      </div>
      <Logo size="md" />
      <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.4em] text-brand-orange">404</p>
      <h1 className="mt-4 max-w-[18ch] font-display text-hero-sm font-extrabold text-light">
        Страница не найдена
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-light/55">
        Такой страницы нет или она была перемещена. Вернитесь на главную или посмотрите наши услуги и тарифы.
      </p>
      <nav className="mt-9 flex flex-wrap items-center justify-center gap-4" aria-label="Полезные ссылки">
        <Link href="/" className="btn-lime">На главную</Link>
        <Link href="/pricing" className="btn-ghost">Тарифы</Link>
        <Link href="/contacts" className="btn-ghost">Контакты</Link>
      </nav>
    </main>
  );
}
