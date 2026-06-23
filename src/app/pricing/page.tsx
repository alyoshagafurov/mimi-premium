'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { cn, formatMoney } from '@/lib/utils';

/**
 * Tariff data sourced from the mimi brandbook brochure.
 * Enum (START/GROWTH/PREMIUM) is preserved in Prisma — UI shows the brand names.
 */
const PLANS = [
  {
    id: 'START', // → PRO
    name: 'PRO',
    firstMonth: 5000,
    recurring: 5000,
    tagline: 'Для стартапов и нового бизнеса',
    audience: [
      'стартапы и новые бизнесы',
      'малый бизнес с ограниченным бюджетом',
      'эксперты и локальные услуги',
      'те, кто только начинает с таргетом',
    ],
    goal: 'Получить первые стабильные заявки и базовое понимание маркетинга.',
    result: 'Вы видите, какие связки работают и куда идут деньги.',
    features: [
      'Мини-стратегия',
      'Таргетированная реклама + аналитика',
      'Понятная отчётность',
      '4 продающих Reels',
      'До 8 рекламных креативов',
    ],
    cta: 'Выбрать PRO',
  },
  {
    id: 'GROWTH', // → STANDART
    name: 'STANDART',
    firstMonth: 8000,
    recurring: 8000,
    tagline: 'Порядок, бренд и системная воронка продаж',
    featured: true,
    audience: [
      'малый и средний бизнес',
      'компании, которые уже продают, но не выделяются',
      'проекты с хаотичным маркетингом',
      'бизнес, готовый инвестировать в рост',
    ],
    goal: 'Навести порядок, усилить бренд и выстроить системную воронку продаж.',
    result: 'Порядок в маркетинге, рост узнаваемости и выстроенная система привлечения клиентов.',
    features: [
      'Маркетинговая стратегия',
      'Таргетированная реклама + аналитика',
      'Понятная отчётность',
      '4 продающих Reels',
      'До 15 рекламных креативов',
      'Брендинг: брендбук + дизайн мерча',
      'Построение воронки и систематизация',
      'Консультация отдела продаж (1 раз в месяц)',
    ],
    cta: 'Выбрать STANDART',
  },
  {
    id: 'PREMIUM', // → ELITE
    name: 'ELITE',
    firstMonth: 12000,
    recurring: 12000,
    tagline: 'Маркетинг как система, связанная с продажами',
    audience: [
      'бизнес, готовый к масштабированию',
      'тот, кто хочет управляемый рост, а не эксперименты',
    ],
    goal: 'Построить маркетинг как систему и связать его с продажами.',
    result: 'Прогнозируемые заявки, сильный бренд и рост без хаоса.',
    features: [
      'Полная стратегия: анализ конкурентов, продукта и медиа',
      'KPI и дорожная карта, ИТП и разметка',
      'Брендинг: брендбук + дизайн мерча',
      'Таргетированная реклама + глубокая аналитика',
      'Понятная отчётность',
      '8 продающих Reels',
      'До 15 рекламных креативов',
      'Контент-направления для SMM',
      '3 консультации для отдела продаж',
      'Постоянное участие на всех этапах роста',
      'Создание веб-страницы (со 2-го месяца сотрудничества)',
    ],
    cta: 'Выбрать ELITE',
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const choose = (planId: string) => {
    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=/checkout?plan=${planId}`);
      return;
    }
    router.push(`/checkout?plan=${planId}`);
  };

  return (
    <div className="relative min-h-screen">
      <TopNav />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-brand-purple/15 blur-3xl" />
      </div>
      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="chip text-brand-lime/80">Тарифы</span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Выберите свой <span className="text-lime-grad">формат роста</span>
          </h1>
          <p className="mt-4 text-base text-muted">
            Гибкая тарифная система: подбираем решение под цели бизнеса, масштаб и бюджет.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className={cn(
                'relative flex flex-col rounded-3xl p-8',
                plan.featured ? 'glass-lime border-brand-lime/40 shadow-lime-lg' : 'glass',
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-lime-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink shadow-lime">
                  Хит
                </span>
              )}
              <div>
                <h3 className="font-display text-3xl font-extrabold tracking-tight text-brand-lime">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
                <div className="mt-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-extrabold text-light">
                      {formatMoney(plan.firstMonth).replace(' сомони', '')}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted">сомони</span>
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-brand-orange">
                    первый месяц
                  </p>
                  {plan.recurring !== plan.firstMonth && (
                    <p className="mt-1 text-[11px] text-muted">
                      Со второго месяца — {formatMoney(plan.recurring)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-white/5 pt-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Подходит для</p>
                <ul className="mt-2 space-y-1.5 text-sm text-light/85">
                  {plan.audience.map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-brand-orange" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Цель тарифа</p>
                <p className="mt-1.5 text-sm text-light/90">{plan.goal}</p>
              </div>

              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Результат</p>
                <p className="mt-1.5 text-sm text-light/90">{plan.result}</p>
              </div>

              <div className="mt-5 border-t border-white/5 pt-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Что входит</p>
                <ul className="mt-2 space-y-2 text-sm text-light/90">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand-lime/20 text-[10px] font-bold text-brand-lime">
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => choose(plan.id)}
                className={cn('mt-7 w-full', plan.featured ? 'btn-lime' : 'btn-ghost')}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm uppercase tracking-[0.32em] text-brand-orange">
            Minimise the noise. Maximise the impact.
          </p>
          <Link
            href="/contacts"
            className="mt-4 inline-block text-xs uppercase tracking-[0.2em] text-muted transition hover:text-brand-lime"
          >
            Нужен индивидуальный пакет? Свяжитесь с нами →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
