'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { cn, formatMoney } from '@/lib/utils';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

type PlanCopy = {
  tagline: string;
  audience: string[];
  goal: string;
  result: string;
  features: string[];
  cta: string;
};
const PLAN_META = [
  { id: 'START', name: 'PRO', firstMonth: 5000, recurring: 5000 },
  { id: 'GROWTH', name: 'STANDART', firstMonth: 8000, recurring: 8000, featured: true },
  { id: 'PREMIUM', name: 'ELITE', firstMonth: 12000, recurring: 12000 },
];

const ru = {
  chip: 'Тарифы',
  heading: 'Выберите свой',
  headingAccent: 'формат роста',
  subtitle: 'Гибкая тарифная система: подбираем решение под цели бизнеса, масштаб и бюджет.',
  currency: 'сомони',
  firstMonth: 'первый месяц',
  fromSecond: 'Со второго месяца —',
  hit: 'Хит',
  suitableFor: 'Подходит для',
  goalLabel: 'Цель тарифа',
  resultLabel: 'Результат',
  includedLabel: 'Что входит',
  tagline: 'Minimise the noise. Maximise the impact.',
  customPlan: 'Нужен индивидуальный пакет? Свяжитесь с нами →',
  plans: [
    {
      tagline: 'Для стартапов и нового бизнеса',
      audience: ['стартапы и новые бизнесы', 'малый бизнес с ограниченным бюджетом', 'эксперты и локальные услуги', 'те, кто только начинает с таргетом'],
      goal: 'Получить первые стабильные заявки и базовое понимание маркетинга.',
      result: 'Вы видите, какие связки работают и куда идут деньги.',
      features: ['Мини-стратегия', 'Таргетированная реклама + аналитика', 'Понятная отчётность', '4 продающих Reels', 'До 8 рекламных креативов'],
      cta: 'Выбрать PRO',
    },
    {
      tagline: 'Порядок, бренд и системная воронка продаж',
      audience: ['малый и средний бизнес', 'компании, которые уже продают, но не выделяются', 'проекты с хаотичным маркетингом', 'бизнес, готовый инвестировать в рост'],
      goal: 'Навести порядок, усилить бренд и выстроить системную воронку продаж.',
      result: 'Порядок в маркетинге, рост узнаваемости и выстроенная система привлечения клиентов.',
      features: ['Маркетинговая стратегия', 'Таргетированная реклама + аналитика', 'Понятная отчётность', '4 продающих Reels', 'До 15 рекламных креативов', 'Брендинг: брендбук + дизайн мерча', 'Построение воронки и систематизация', 'Консультация отдела продаж (1 раз в месяц)'],
      cta: 'Выбрать STANDART',
    },
    {
      tagline: 'Маркетинг как система, связанная с продажами',
      audience: ['бизнес, готовый к масштабированию', 'тот, кто хочет управляемый рост, а не эксперименты'],
      goal: 'Построить маркетинг как систему и связать его с продажами.',
      result: 'Прогнозируемые заявки, сильный бренд и рост без хаоса.',
      features: ['Полная стратегия: анализ конкурентов, продукта и медиа', 'KPI и дорожная карта, ИТП и разметка', 'Брендинг: брендбук + дизайн мерча', 'Таргетированная реклама + глубокая аналитика', 'Понятная отчётность', '8 продающих Reels', 'До 15 рекламных креативов', 'Контент-направления для SMM', '3 консультации для отдела продаж', 'Постоянное участие на всех этапах роста', 'Создание веб-страницы (со 2-го месяца сотрудничества)'],
      cta: 'Выбрать ELITE',
    },
  ] as PlanCopy[],
};
const en: typeof ru = {
  chip: 'Plans',
  heading: 'Choose your',
  headingAccent: 'growth format',
  subtitle: 'Flexible pricing: we match the solution to your business goals, scale and budget.',
  currency: 'somoni',
  firstMonth: 'first month',
  fromSecond: 'From second month —',
  hit: 'Popular',
  suitableFor: 'Suitable for',
  goalLabel: 'Plan goal',
  resultLabel: 'Result',
  includedLabel: 'What is included',
  tagline: 'Minimise the noise. Maximise the impact.',
  customPlan: 'Need a custom package? Get in touch →',
  plans: [
    {
      tagline: 'For startups and new businesses',
      audience: ['startups and new businesses', 'small business with a limited budget', 'experts and local services', 'those just starting with targeting'],
      goal: 'Get your first stable leads and a basic understanding of marketing.',
      result: 'You see which combinations work and where the money goes.',
      features: ['Mini-strategy', 'Targeted ads + analytics', 'Clear reporting', '4 selling Reels', 'Up to 8 ad creatives'],
      cta: 'Choose PRO',
    },
    {
      tagline: 'Order, brand and a systematic sales funnel',
      audience: ['small and medium business', 'companies that sell but do not stand out', 'projects with chaotic marketing', 'business ready to invest in growth'],
      goal: 'Bring order, strengthen the brand and build a systematic sales funnel.',
      result: 'Order in marketing, growing recognition and a built-in client acquisition system.',
      features: ['Marketing strategy', 'Targeted ads + analytics', 'Clear reporting', '4 selling Reels', 'Up to 15 ad creatives', 'Branding: brandbook + merch design', 'Funnel building and systematization', 'Sales-team consulting (once a month)'],
      cta: 'Choose STANDART',
    },
    {
      tagline: 'Marketing as a system linked to sales',
      audience: ['business ready to scale', 'those who want managed growth, not experiments'],
      goal: 'Build marketing as a system and link it to sales.',
      result: 'Predictable leads, a strong brand and growth without chaos.',
      features: ['Full strategy: competitor, product and media analysis', 'KPIs and roadmap, UVP and tagging', 'Branding: brandbook + merch design', 'Targeted ads + deep analytics', 'Clear reporting', '8 selling Reels', 'Up to 15 ad creatives', 'Content directions for SMM', '3 sales-team consultations', 'Ongoing participation at every growth stage', 'Web page creation (from 2nd month of cooperation)'],
      cta: 'Choose ELITE',
    },
  ] as PlanCopy[],
};
const tg: typeof ru = {
  chip: 'Тарифҳо',
  heading: 'Формати рушди',
  headingAccent: 'худро интихоб кунед',
  subtitle: 'Системаи тарифии чандир: ҳалли мувофиқ ба ҳадафҳо, миқёс ва буҷети бизнес.',
  currency: 'сомонӣ',
  firstMonth: 'моҳи аввал',
  fromSecond: 'Аз моҳи дуюм —',
  hit: 'Ҳит',
  suitableFor: 'Мувофиқ барои',
  goalLabel: 'Ҳадафи тариф',
  resultLabel: 'Натиҷа',
  includedLabel: 'Чӣ дохил аст',
  tagline: 'Minimise the noise. Maximise the impact.',
  customPlan: 'Бастаи инфиродӣ лозим? Бо мо тамос гиред →',
  plans: [
    {
      tagline: 'Барои стартапҳо ва бизнеси нав',
      audience: ['стартапҳо ва бизнесҳои нав', 'бизнеси хурд бо буҷети маҳдуд', 'мутахассисон ва хадамоти маҳаллӣ', 'онҳое, ки нав бо таргет оғоз мекунанд'],
      goal: 'Гирифтани аввалин дархостҳои устувор ва фаҳмиши асосии маркетинг.',
      result: 'Шумо мебинед, ки кадом омезишҳо кор мекунанд ва пул ба куҷо меравад.',
      features: ['Мини-стратегия', 'Рекламаи таргетӣ + аналитика', 'Ҳисоботи фаҳмо', '4 Reels-и фурӯшанда', 'То 8 креативи рекламавӣ'],
      cta: 'Интихоби PRO',
    },
    {
      tagline: 'Тартиб, бренд ва воронкаи системавии фурӯш',
      audience: ['бизнеси хурд ва миёна', 'ширкатҳое, ки мефурӯшанд аммо ҷудо намешаванд', 'лоиҳаҳо бо маркетинги бетартиб', 'бизнесе, ки ба сармоягузорӣ дар рушд тайёр аст'],
      goal: 'Тартиб овардан, брендро қавӣ кардан ва воронкаи системавии фурӯш сохтан.',
      result: 'Тартиб дар маркетинг, рушди шинохт ва системаи омодаи ҷалби муштариён.',
      features: ['Стратегияи маркетингӣ', 'Рекламаи таргетӣ + аналитика', 'Ҳисоботи фаҳмо', '4 Reels-и фурӯшанда', 'То 15 креативи рекламавӣ', 'Брендинг: брендбук + дизайни мерч', 'Сохтани воронка ва системасозӣ', 'Маслиҳати шуъбаи фурӯш (1 бор дар моҳ)'],
      cta: 'Интихоби STANDART',
    },
    {
      tagline: 'Маркетинг ҳамчун система, ки бо фурӯш алоқаманд аст',
      audience: ['бизнесе, ки ба масштабсозӣ тайёр аст', 'касе, ки рушди идорашавандаро мехоҳад, на озмоиш'],
      goal: 'Маркетингро ҳамчун система сохтан ва бо фурӯш пайваст кардан.',
      result: 'Дархостҳои пешбинишаванда, бренди қавӣ ва рушд бе бетартибӣ.',
      features: ['Стратегияи пурра: таҳлили рақибон, маҳсулот ва медиа', 'KPI ва харитаи роҳ, ИТП ва нишонгузорӣ', 'Брендинг: брендбук + дизайни мерч', 'Рекламаи таргетӣ + аналитикаи амиқ', 'Ҳисоботи фаҳмо', '8 Reels-и фурӯшанда', 'То 15 креативи рекламавӣ', 'Самтҳои контент барои SMM', '3 маслиҳат барои шуъбаи фурӯш', 'Иштироки доимӣ дар ҳамаи марҳилаҳои рушд', 'Сохтани саҳифаи вебӣ (аз моҳи 2-уми ҳамкорӣ)'],
      cta: 'Интихоби ELITE',
    },
  ] as PlanCopy[],
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export default function PricingPage() {
  const t = useCopy(COPY);
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
          <span className="chip text-brand-lime/80">{t.chip}</span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            {t.heading} <span className="text-lime-grad">{t.headingAccent}</span>
          </h1>
          <p className="mt-4 text-base text-muted">{t.subtitle}</p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLAN_META.map((meta, idx) => {
            const plan = { ...meta, ...t.plans[idx] };
            return (
              <motion.div
                key={meta.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className={cn(
                  'relative flex flex-col rounded-3xl p-8',
                  meta.featured ? 'glass-lime border-brand-lime/40 shadow-lime-lg' : 'glass',
                )}
              >
                {meta.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-lime-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink shadow-lime">
                    {t.hit}
                  </span>
                )}
                <div>
                  <h3 className="font-display text-3xl font-extrabold tracking-tight text-brand-lime">
                    {meta.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
                  <div className="mt-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-4xl font-extrabold text-light">
                        {formatMoney(meta.firstMonth).replace(' сомони', '')}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-muted">{t.currency}</span>
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-brand-orange">
                      {t.firstMonth}
                    </p>
                    {meta.recurring !== meta.firstMonth && (
                      <p className="mt-1 text-[11px] text-muted">
                        {t.fromSecond} {formatMoney(meta.recurring)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t border-white/5 pt-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{t.suitableFor}</p>
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
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{t.goalLabel}</p>
                  <p className="mt-1.5 text-sm text-light/90">{plan.goal}</p>
                </div>

                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{t.resultLabel}</p>
                  <p className="mt-1.5 text-sm text-light/90">{plan.result}</p>
                </div>

                <div className="mt-5 border-t border-white/5 pt-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{t.includedLabel}</p>
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
                  onClick={() => choose(meta.id)}
                  className={cn('mt-7 w-full', meta.featured ? 'btn-lime' : 'btn-ghost')}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm uppercase tracking-[0.32em] text-brand-orange">
            {t.tagline}
          </p>
          <Link
            href="/contacts"
            className="mt-4 inline-block text-xs uppercase tracking-[0.2em] text-muted transition hover:text-brand-lime"
          >
            {t.customPlan}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
