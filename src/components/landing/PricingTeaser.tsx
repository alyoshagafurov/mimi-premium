'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { cn } from '@/lib/utils';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

type PlanCopy = { audience: string; bullets: string[] };
const PLAN_META = [
  { name: 'PRO', price: '5 000', href: '/pricing' },
  { name: 'STANDART', price: '8 000', featured: true, href: '/pricing' },
  { name: 'ELITE', price: '12 000', href: '/pricing' },
];

const ru = {
  eyebrow: 'Тарифы',
  titlePre: 'Три формата',
  titleEmphasis: 'роста.',
  subtitle: 'Цены — из брендбука. Подгоняем под цели, бюджет и нишу.',
  sub: 'сомони / мес',
  hit: 'Хит',
  details: 'Подробнее',
  compare: 'Полное сравнение тарифов',
  plans: [
    { audience: 'Стартапы и новый бизнес', bullets: ['Мини-стратегия', 'Таргет + аналитика', '4 Reels · до 8 креативов'] },
    { audience: 'Бизнес, готовый к росту', bullets: ['Стратегия + аналитика', '15 креативов · 4 Reels', 'Брендинг + воронка', 'Консультации продаж'] },
    { audience: 'Управляемый рост, не эксперимент', bullets: ['Полная стратегия + брендинг', '8 Reels · 15 креативов', 'Контент для SMM', 'Сайт в подарок'] },
  ] as PlanCopy[],
};
const en: typeof ru = {
  eyebrow: 'Plans',
  titlePre: 'Three formats',
  titleEmphasis: 'of growth.',
  subtitle: 'Prices are from our brandbook. Tailored to goals, budget and niche.',
  sub: 'somoni / mo',
  hit: 'Popular',
  details: 'Details',
  compare: 'Full plan comparison',
  plans: [
    { audience: 'Startups & new businesses', bullets: ['Mini-strategy', 'Targeting + analytics', '4 Reels · up to 8 creatives'] },
    { audience: 'Business ready to grow', bullets: ['Strategy + analytics', '15 creatives · 4 Reels', 'Branding + funnel', 'Sales consulting'] },
    { audience: 'Managed growth, not an experiment', bullets: ['Full strategy + branding', '8 Reels · 15 creatives', 'SMM content', 'Website included'] },
  ] as PlanCopy[],
};
const tg: typeof ru = {
  eyebrow: 'Тарифҳо',
  titlePre: 'Се формати',
  titleEmphasis: 'рушд.',
  subtitle: 'Нархҳо аз брендбук. Мутобиқ ба ҳадафҳо, буҷет ва ниша.',
  sub: 'сомонӣ / моҳ',
  hit: 'Ҳит',
  details: 'Муфассал',
  compare: 'Муқоисаи пурраи тарифҳо',
  plans: [
    { audience: 'Стартапҳо ва бизнеси нав', bullets: ['Мини-стратегия', 'Таргет + аналитика', '4 Reels · то 8 креатив'] },
    { audience: 'Бизнес, ки ба рушд тайёр аст', bullets: ['Стратегия + аналитика', '15 креатив · 4 Reels', 'Брендинг + воронка', 'Маслиҳати фурӯш'] },
    { audience: 'Рушди идорашаванда, на озмоиш', bullets: ['Стратегияи пурра + брендинг', '8 Reels · 15 креатив', 'Контент барои SMM', 'Сайт тӯҳфа'] },
  ] as PlanCopy[],
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

function TiltCard({
  meta,
  copy,
  t,
  i,
}: {
  meta: (typeof PLAN_META)[number];
  copy: PlanCopy;
  t: typeof ru;
  i: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1100px) rotateY(${nx * 6}deg) rotateX(${-ny * 6}deg) translate3d(0,${-2 - Math.abs(nx) * 2}px,0)`;
    if (spotRef.current) {
      spotRef.current.style.setProperty('--lx', `${(e.clientX - r.left) / r.width * 100}%`);
      spotRef.current.style.setProperty('--ly', `${(e.clientY - r.top) / r.height * 100}%`);
      spotRef.current.style.opacity = '1';
    }
  };
  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = '';
    if (spotRef.current) spotRef.current.style.opacity = '0';
  };

  return (
    <Reveal delay={0.06 + i * 0.06}>
      <motion.div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'relative flex h-full flex-col rounded-3xl border p-10 transition-[transform,box-shadow] duration-300 ease-out will-change-transform',
          meta.featured
            ? 'border-brand-lime/40 bg-brand-lime/[0.03] shadow-[0_30px_80px_-30px_rgba(212,236,76,0.18)]'
            : 'border-white/[0.06] bg-ink2/30',
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <span
          ref={spotRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(280px circle at var(--lx, 50%) var(--ly, 50%), rgba(212,236,76,0.12), transparent 70%)',
          }}
        />

        {meta.featured && (
          <span className="absolute -top-3 left-10 rounded-full bg-lime-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
            {t.hit}
          </span>
        )}
        <div className="relative">
          <h3 className="font-display text-2xl font-extrabold tracking-tight text-brand-lime">
            {meta.name}
          </h3>
          <p className="mt-2 text-sm text-light/50">{copy.audience}</p>
        </div>

        <div className="relative mt-10">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-6xl font-extrabold leading-none tracking-tight text-light">
              {meta.price}
            </span>
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-brand-orange">{t.sub}</p>
        </div>

        <ul className="relative mt-10 flex-1 space-y-3 text-sm text-light/75">
          {copy.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-brand-lime" />
              {b}
            </li>
          ))}
        </ul>

        <Link
          href={meta.href}
          className={cn(
            'relative mt-12 inline-flex w-fit items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] transition-colors',
            meta.featured ? 'text-brand-lime' : 'text-light/70 hover:text-brand-lime',
          )}
        >
          {t.details}
          <span>→</span>
        </Link>
      </motion.div>
    </Reveal>
  );
}

export function PricingTeaser() {
  const t = useCopy(COPY);
  return (
    <section id="pricing" className="relative w-full px-6 py-section lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.5em] text-brand-orange">{t.eyebrow}</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 max-w-[14ch] font-display text-hero-sm font-extrabold">
                {t.titlePre}{' '}
                <span className="font-serif italic font-normal text-lime-grad">
                  {t.titleEmphasis}
                </span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <p className="max-w-md text-base leading-relaxed text-light/55 lg:text-right">
              {t.subtitle}
            </p>
          </Reveal>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {PLAN_META.map((m, i) => (
            <TiltCard key={m.name} meta={m} copy={t.plans[i]} t={t} i={i} />
          ))}
        </div>

        <Reveal delay={0.5} className="mt-20 flex justify-center">
          <MagneticButton href="/pricing" variant="ghost" arrow>
            {t.compare}
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  );
}
