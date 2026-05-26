'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { cn } from '@/lib/utils';

/**
 * Pricing teaser — signature: 3D tilt on hover. Each card responds
 * to cursor position inside it (small ±5° rotateX/Y, a translucent
 * lime hotspot follows the cursor for "glass under spotlight" feel).
 */

const plans = [
  {
    name: 'PRO',
    audience: 'Стартапы и новый бизнес',
    price: '2 500',
    sub: 'сомони / мес',
    bullets: ['Таргет + аналитика', 'До 8 креативов', '4 продающих Reels'],
    href: '/pricing',
  },
  {
    name: 'STANDART',
    audience: 'Бизнес, готовый к росту',
    price: '6 000',
    sub: 'сомони / 1-й мес',
    second: 'со 2-го месяца — 5 000',
    bullets: ['Полная аналитика', '15 креативов', 'Брендинг + воронка', 'Аудит маркетинга'],
    featured: true,
    href: '/pricing',
  },
  {
    name: 'ELITE',
    audience: 'Управляемый рост, не эксперимент',
    price: '10 000',
    sub: 'сомони / 1-й мес',
    second: 'со 2-го месяца — 8 000',
    bullets: ['Стратегия и рост-план', 'Полный брендинг', '8–10 Reels', 'Сайт в подарок'],
    href: '/pricing',
  },
];

function TiltCard({
  plan,
  i,
}: {
  plan: (typeof plans)[number];
  i: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
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
          plan.featured
            ? 'border-brand-lime/40 bg-brand-lime/[0.03] shadow-[0_30px_80px_-30px_rgba(212,236,76,0.18)]'
            : 'border-white/[0.06] bg-ink2/30',
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* mouse spotlight */}
        <span
          ref={spotRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(280px circle at var(--lx, 50%) var(--ly, 50%), rgba(212,236,76,0.12), transparent 70%)',
          }}
        />

        {plan.featured && (
          <span className="absolute -top-3 left-10 rounded-full bg-lime-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
            Хит
          </span>
        )}
        <div className="relative">
          <h3 className="font-display text-2xl font-extrabold tracking-tight text-brand-lime">
            {plan.name}
          </h3>
          <p className="mt-2 text-sm text-light/50">{plan.audience}</p>
        </div>

        <div className="relative mt-10">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-6xl font-extrabold leading-none tracking-tight text-light">
              {plan.price}
            </span>
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-brand-orange">{plan.sub}</p>
          {plan.second && <p className="mt-1.5 text-[11px] text-light/40">{plan.second}</p>}
        </div>

        <ul className="relative mt-10 flex-1 space-y-3 text-sm text-light/75">
          {plan.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-brand-lime" />
              {b}
            </li>
          ))}
        </ul>

        <Link
          href={plan.href}
          className={cn(
            'relative mt-12 inline-flex w-fit items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] transition-colors',
            plan.featured ? 'text-brand-lime' : 'text-light/70 hover:text-brand-lime',
          )}
        >
          Подробнее
          <span>→</span>
        </Link>
      </motion.div>
    </Reveal>
  );
}

export function PricingTeaser() {
  return (
    <section id="pricing" className="relative w-full px-6 py-section lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.5em] text-brand-orange">Тарифы</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 max-w-[14ch] font-display text-hero-sm font-extrabold">
                Три формата{' '}
                <span className="font-serif italic font-normal text-lime-grad">
                  роста.
                </span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <p className="max-w-md text-base leading-relaxed text-light/55 lg:text-right">
              Цены — из брендбука. Подгоняем под цели, бюджет и нишу.
            </p>
          </Reveal>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((p, i) => (
            <TiltCard key={p.name} plan={p} i={i} />
          ))}
        </div>

        <Reveal delay={0.5} className="mt-20 flex justify-center">
          <MagneticButton href="/pricing" variant="ghost" arrow>
            Полное сравнение тарифов
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  );
}
