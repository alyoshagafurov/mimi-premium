'use client';

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
  { id: 'GROWTH', name: 'STANDART', firstMonth: 9000, recurring: 8000, featured: true },
  { id: 'PREMIUM', name: 'ELITE', firstMonth: 12000, recurring: 10000 },
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
  plans: [
    {
      tagline: 'Для стартапов и малого бизнеса',
      audience: ['стартапы и новые бизнесы', 'малый бизнес с ограниченным бюджетом', 'эксперты и локальные услуги', 'те, кто только начинает работать с таргетом'],
      goal: 'Получить первые стабильные заявки и базовое понимание маркетинга.',
      result: 'Вы понимаете, какие связки работают и куда идут деньги.',
      features: ['Таргетированная реклама', 'Аналитика и понятные отчёты (Excel)', 'До 8 рекламных креативов', '4 продающих Reels'],
      cta: 'Выбрать PRO',
    },
    {
      tagline: 'Для бизнеса, который хочет выделиться на рынке',
      audience: ['малый и средний бизнес', 'компании, которые уже продают, но не выделяются на рынке', 'проекты с хаотичным маркетингом', 'бизнесы, готовые инвестировать в рост'],
      goal: 'Навести порядок, усилить бренд и выстроить системную воронку продаж.',
      result: 'Порядок в маркетинге, рост узнаваемости и выстроенная система привлечения клиентов.',
      features: ['Стратегия и анализ конкурентов', 'Таргетированная реклама', 'Аналитика и понятные отчёты (Excel)', 'До 10 рекламных креативов', '5 продающих Reels', 'Контент-направление под нишу', 'Брендинг: брендбук + дизайн мерча (футболки, кепки, визитки и др.)', 'Построение воронки и систематизация', 'Консультации отдела продаж'],
      cta: 'Выбрать STANDART',
    },
    {
      tagline: 'Маркетинг как система, связанная с продажами',
      audience: ['бизнес, готовый к масштабированию', 'тот, кто хочет управляемый рост, а не эксперименты'],
      goal: 'Построить маркетинг как систему и связать его с продажами.',
      result: 'Прогнозируемые заявки, сильный бренд и рост без хаоса.',
      features: ['Маркетинговая стратегия и рост-план', 'Анализ рынка и конкурентов', 'Полный брендинг: брендбук + дизайн мерча', 'Таргетированная реклама', 'Глубокая аналитика + понятные отчёты (Excel)', 'До 15 рекламных креативов', '8–10 продающих Reels', 'Чёткие форматы контента (мы не ведём SMM — задаём стратегию и направление)', '3 консультации отдела продаж (от эксперта продаж)', 'Веб-страница — в подарок', 'Постоянное участие на всех этапах роста', 'Масштабирование через соцсети, ТВ и наружную рекламу'],
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
  plans: [
    {
      tagline: 'For startups and small business',
      audience: ['startups and new businesses', 'small business with a limited budget', 'experts and local services', 'those just starting with targeting'],
      goal: 'Get your first stable leads and a basic understanding of marketing.',
      result: 'You understand which combinations work and where the money goes.',
      features: ['Targeted advertising', 'Analytics & clear reports (Excel)', 'Up to 8 ad creatives', '4 selling Reels'],
      cta: 'Choose PRO',
    },
    {
      tagline: 'For business that wants to stand out',
      audience: ['small and medium business', 'companies that already sell but don’t stand out', 'projects with chaotic marketing', 'businesses ready to invest in growth'],
      goal: 'Bring order, strengthen the brand and build a systematic sales funnel.',
      result: 'Order in marketing, growing recognition and a built-in client acquisition system.',
      features: ['Strategy & competitor analysis', 'Targeted advertising', 'Analytics & clear reports (Excel)', 'Up to 10 ad creatives', '5 selling Reels', 'Content direction for your niche', 'Branding: brandbook + merch design (t-shirts, caps, cards, etc.)', 'Funnel building & systematization', 'Sales-team consulting'],
      cta: 'Choose STANDART',
    },
    {
      tagline: 'Marketing as a system linked to sales',
      audience: ['business ready to scale', 'those who want managed growth, not experiments'],
      goal: 'Build marketing as a system and link it to sales.',
      result: 'Predictable leads, a strong brand and growth without chaos.',
      features: ['Marketing strategy & growth plan', 'Market & competitor analysis', 'Full branding: brandbook + merch design', 'Targeted advertising', 'Deep analytics + clear reports (Excel)', 'Up to 15 ad creatives', '8–10 selling Reels', 'Clear content formats (we don’t run SMM — we set the strategy & direction)', '3 sales-team consultations (with a sales expert)', 'Web page — as a gift', 'Ongoing participation at every growth stage', 'Scaling via social media, TV & outdoor ads'],
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
  plans: [
    {
      tagline: 'Барои стартапҳо ва бизнеси хурд',
      audience: ['стартапҳо ва бизнесҳои нав', 'бизнеси хурд бо буҷети маҳдуд', 'мутахассисон ва хадамоти маҳаллӣ', 'онҳое, ки нав бо таргет оғоз мекунанд'],
      goal: 'Гирифтани аввалин дархостҳои устувор ва фаҳмиши асосии маркетинг.',
      result: 'Шумо мефаҳмед, ки кадом омезишҳо кор мекунанд ва пул ба куҷо меравад.',
      features: ['Рекламаи таргетӣ', 'Аналитика ва ҳисоботи фаҳмо (Excel)', 'То 8 креативи рекламавӣ', '4 Reels-и фурӯшанда'],
      cta: 'Интихоби PRO',
    },
    {
      tagline: 'Барои бизнесе, ки мехоҳад дар бозор ҷудо шавад',
      audience: ['бизнеси хурд ва миёна', 'ширкатҳое, ки мефурӯшанд аммо ҷудо намешаванд', 'лоиҳаҳо бо маркетинги бетартиб', 'бизнесҳое, ки ба сармоягузорӣ дар рушд тайёранд'],
      goal: 'Тартиб овардан, брендро қавӣ кардан ва воронкаи системавии фурӯш сохтан.',
      result: 'Тартиб дар маркетинг, рушди шинохт ва системаи омодаи ҷалби муштариён.',
      features: ['Стратегия ва таҳлили рақибон', 'Рекламаи таргетӣ', 'Аналитика ва ҳисоботи фаҳмо (Excel)', 'То 10 креативи рекламавӣ', '5 Reels-и фурӯшанда', 'Самти контент барои ниша', 'Брендинг: брендбук + дизайни мерч (футболка, кулоҳ, визитка ва ғ.)', 'Сохтани воронка ва системасозӣ', 'Маслиҳати шуъбаи фурӯш'],
      cta: 'Интихоби STANDART',
    },
    {
      tagline: 'Маркетинг ҳамчун система, ки бо фурӯш алоқаманд аст',
      audience: ['бизнесе, ки ба масштабсозӣ тайёр аст', 'касе, ки рушди идорашавандаро мехоҳад, на озмоиш'],
      goal: 'Маркетингро ҳамчун система сохтан ва бо фурӯш пайваст кардан.',
      result: 'Дархостҳои пешбинишаванда, бренди қавӣ ва рушд бе бетартибӣ.',
      features: ['Стратегияи маркетингӣ ва рост-план', 'Таҳлили бозор ва рақибон', 'Брендинги пурра: брендбук + дизайни мерч', 'Рекламаи таргетӣ', 'Аналитикаи амиқ + ҳисоботи фаҳмо (Excel)', 'То 15 креативи рекламавӣ', '8–10 Reels-и фурӯшанда', 'Форматҳои равшани контент (мо SMM намебарем — стратегия ва самт медиҳем)', '3 маслиҳати шуъбаи фурӯш (аз коршиноси фурӯш)', 'Саҳифаи вебӣ — тӯҳфа', 'Иштироки доимӣ дар ҳамаи марҳилаҳои рушд', 'Масштабсозӣ тавассути шабакаҳои иҷтимоӣ, ТВ ва рекламаи берунӣ'],
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
