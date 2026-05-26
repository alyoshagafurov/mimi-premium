'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Process — interactive sticky card (desktop) + inline accordion (mobile).
 *
 *   Desktop:
 *     LEFT   sticky card that morphs on hover — shows step title, description,
 *            and an abstract visual. Timeline line still draws on scroll.
 *     RIGHT  step list with hover-driven highlight.
 *
 *   Mobile:
 *     Single column, each step expands inline on tap.
 */

type Step = {
  n: string;
  title: string;
  desc: string;
  detail: string;
  visual: 'analyze' | 'strategy' | 'launch' | 'optimize' | 'scale';
};

const STEPS: Step[] = [
  {
    n: '01',
    title: 'Анализ',
    desc: 'Погружение в нишу, продукт, аудиторию и текущие связки.',
    detail: 'Аудит рекламных кабинетов, CRM, посадок и контента. Формируем карту гипотез и приоритеты для запуска.',
    visual: 'analyze',
  },
  {
    n: '02',
    title: 'Стратегия',
    desc: 'План роста на 6–12 месяцев с понятными KPI.',
    detail: 'Дорожная карта с приоритетами, бюджетами и KPI по каждому каналу. Не презентация — рабочий документ.',
    visual: 'strategy',
  },
  {
    n: '03',
    title: 'Запуск',
    desc: 'Креативы, посадки, кабинеты, аналитика — за 7–14 дней.',
    detail: 'Собираем всё в систему: рекламные кампании, UTM-разметку, CRM-интеграции, дашборд аналитики.',
    visual: 'launch',
  },
  {
    n: '04',
    title: 'Оптимизация',
    desc: 'Еженедельный разбор: убираем слабое, усиливаем работающее.',
    detail: 'A/B тесты креативов и аудиторий. Перераспределение бюджетов на основе данных, а не ощущений.',
    visual: 'optimize',
  },
  {
    n: '05',
    title: 'Масштабирование',
    desc: 'Увеличиваем бюджет на проверенных связках, без рывков.',
    detail: 'Подключаем новые каналы и форматы. Растём вместе с клиентом — от тестовых бюджетов до системного роста.',
    visual: 'scale',
  },
];

function StepVisual({ kind }: { kind: Step['visual'] }) {
  switch (kind) {
    case 'analyze':
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <circle cx="100" cy="70" r="50" fill="none" stroke="rgba(212,236,76,0.2)" strokeWidth="0.8" strokeDasharray="3 5" />
          <circle cx="100" cy="70" r="32" fill="none" stroke="rgba(212,236,76,0.4)" strokeWidth="1" />
          <line x1="124" y1="46" x2="160" y2="20" stroke="#D4EC4C" strokeWidth="0.8" />
          <circle cx="160" cy="20" r="3" fill="#FC9603" />
          <text x="166" y="23" fill="rgba(245,241,250,0.5)" fontSize="7" fontFamily="monospace">audit</text>
          <line x1="76" y1="94" x2="44" y2="120" stroke="rgba(212,236,76,0.5)" strokeWidth="0.8" />
          <circle cx="44" cy="120" r="3" fill="#D4EC4C" />
          <text x="24" y="132" fill="rgba(245,241,250,0.5)" fontSize="7" fontFamily="monospace">data</text>
        </svg>
      );
    case 'strategy':
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M 20 110 L 60 90 L 100 95 L 140 60 L 180 30" stroke="#D4EC4C" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          {[{ x: 60, y: 90 }, { x: 100, y: 95 }, { x: 140, y: 60 }, { x: 180, y: 30 }].map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === 3 ? 4 : 2.5} fill={i === 3 ? '#D4EC4C' : '#FC9603'} />
          ))}
          <line x1="20" y1="25" x2="20" y2="120" stroke="rgba(245,241,250,0.1)" strokeWidth="0.6" />
          <line x1="20" y1="120" x2="190" y2="120" stroke="rgba(245,241,250,0.1)" strokeWidth="0.6" />
          <text x="175" y="22" fill="#D4EC4C" fontSize="10" fontFamily="monospace" textAnchor="end">KPI</text>
        </svg>
      );
    case 'launch':
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <polygon points="100,20 130,55 118,55 140,95 115,95 135,130 65,75 90,75 70,40 95,40 80,20" fill="none" stroke="#D4EC4C" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="100" cy="70" r="8" fill="none" stroke="#FC9603" strokeWidth="1" />
          <circle cx="100" cy="70" r="2.5" fill="#FC9603" />
        </svg>
      );
    case 'optimize':
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 28 + i * 35;
            const h = [38, 55, 42, 70, 60][i];
            return (
              <g key={i}>
                <rect x={x} y={120 - h} width="22" height={h} rx="3" fill={i === 3 ? 'rgba(212,236,76,0.35)' : 'rgba(212,236,76,0.12)'} stroke={i === 3 ? '#D4EC4C' : 'rgba(212,236,76,0.3)'} strokeWidth="0.8" />
                {i === 3 && <text x={x + 11} y={120 - h - 6} fill="#D4EC4C" fontSize="8" fontFamily="monospace" textAnchor="middle">best</text>}
              </g>
            );
          })}
          <line x1="20" y1="120" x2="190" y2="120" stroke="rgba(245,241,250,0.1)" strokeWidth="0.6" />
        </svg>
      );
    case 'scale':
      return (
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <path d="M 20 100 C 60 95, 80 80, 100 60 S 150 20, 180 15" stroke="#D4EC4C" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M 20 100 C 60 95, 80 80, 100 60 S 150 20, 180 15 L 180 120 L 20 120 Z" fill="url(#scaleGrad)" />
          <defs>
            <linearGradient id="scaleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(212,236,76,0.12)" />
              <stop offset="100%" stopColor="rgba(212,236,76,0)" />
            </linearGradient>
          </defs>
          <circle cx="180" cy="15" r="4" fill="#D4EC4C" />
          <text x="160" y="10" fill="#FC9603" fontSize="10" fontWeight="bold" fontFamily="monospace">×3</text>
        </svg>
      );
  }
}

export function ProcessSection() {
  const [active, setActive] = useState(0);
  const [mobileOpen, setMobileOpen] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const lineFillRef = useRef<HTMLSpanElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const current = STEPS[active];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      if (lineFillRef.current) {
        gsap.fromTo(
          lineFillRef.current,
          { height: '0%' },
          {
            height: '100%',
            ease: 'none',
            scrollTrigger: {
              trigger: '.process-list',
              start: 'top 70%',
              end: 'bottom 70%',
              scrub: 0.6,
            },
          },
        );
      }
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        gsap.fromTo(
          dot,
          { backgroundColor: 'rgba(212,236,76,0.2)', scale: 1 },
          {
            backgroundColor: '#D4EC4C',
            scale: 1.4,
            scrollTrigger: {
              trigger: `[data-step="${i}"]`,
              start: 'top 60%',
              toggleActions: 'play none none reverse',
            },
            ease: 'power2.out',
            duration: 0.3,
          },
        );
      });
    }, sectionRef);
    document.fonts?.ready?.then(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="process" className="relative w-full px-6 py-section lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr] lg:items-end lg:mb-20">
          <div>
            <Reveal>
              <p className="text-eyebrow uppercase text-brand-orange">Процесс</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 max-w-[14ch] font-display text-hero-sm font-extrabold">
                Пять шагов{' '}
                <span className="font-serif italic font-normal text-lime-grad">
                  к&nbsp;системе.
                </span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <p className="max-w-md text-base leading-relaxed text-light/55 lg:text-right">
              Каждый этап — самостоятельный результат. Цифры с первой недели.
            </p>
          </Reveal>
        </div>

        {/* ─── DESKTOP: sticky card + interactive list ─── */}
        <div className="hidden lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* LEFT: sticky preview card */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-10">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-lime/[0.08] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-brand-purple/[0.18] blur-3xl" />

              <div className="relative flex items-center justify-between">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`pn-${current.n}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="font-mono text-[11px] uppercase tracking-[0.32em] text-brand-orange"
                  >
                    Шаг {current.n} / 05
                  </motion.span>
                </AnimatePresence>
                <span className="text-[10px] uppercase tracking-[0.28em] text-light/35">этап</span>
              </div>

              {/* Visual */}
              <div className="relative mt-8 aspect-[5/3] w-full overflow-hidden rounded-2xl border border-white/[0.05] bg-ink/40">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`pv-${current.n}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex items-center justify-center p-8"
                  >
                    <StepVisual kind={current.visual} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Title + description */}
              <div className="relative mt-8 min-h-[180px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`pt-${current.n}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h3 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-light md:text-4xl">
                      {current.title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-[1.7] text-light/65">
                      {current.desc}
                    </p>
                    <div className="mt-4 h-px w-10 bg-brand-lime/50" />
                    <p className="mt-4 text-sm leading-[1.7] text-light/50">
                      {current.detail}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* RIGHT: step list with timeline */}
          <div className="process-list relative">
            <span className="absolute left-7 top-3 bottom-3 w-px bg-white/[0.07]" aria-hidden />
            <span
              ref={lineFillRef}
              className="absolute left-7 top-3 block w-px bg-gradient-to-b from-brand-lime via-brand-lime to-brand-orange"
              style={{ height: '0%' }}
              aria-hidden
            />

            <ol className="space-y-1">
              {STEPS.map((s, i) => {
                const isActive = active === i;
                return (
                  <Reveal key={s.n} delay={0.04 + i * 0.04}>
                    <li
                      data-step={i}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onClick={() => setActive(i)}
                      tabIndex={0}
                      className="group relative cursor-pointer outline-none"
                    >
                      <motion.div
                        animate={{ x: isActive ? 8 : 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="grid grid-cols-[56px_1fr] items-start gap-6 py-7"
                      >
                        <div className="relative flex items-start pt-2">
                          <span
                            ref={(el) => { dotRefs.current[i] = el; }}
                            className="absolute left-[22px] top-2 h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: 'rgba(212,236,76,0.2)' }}
                          />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-5">
                            <span
                              className={`font-mono text-[11px] tracking-[0.2em] transition-colors duration-300 ${
                                isActive ? 'text-brand-lime' : 'text-brand-orange/70'
                              }`}
                            >
                              {s.n}
                            </span>
                            <h3
                              className={`font-display text-2xl font-extrabold leading-tight tracking-tight transition-colors duration-300 xl:text-3xl ${
                                isActive ? 'text-light' : 'text-light/50'
                              }`}
                            >
                              {s.title}
                            </h3>
                          </div>
                          <p
                            className={`mt-2 max-w-sm text-sm leading-relaxed transition-colors duration-300 ${
                              isActive ? 'text-light/55' : 'text-light/30'
                            }`}
                          >
                            {s.desc}
                          </p>
                        </div>
                      </motion.div>
                    </li>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </div>

        {/* ─── MOBILE: inline accordion with timeline ─── */}
        <div className="process-list relative lg:hidden">
          <span className="absolute left-3 top-3 bottom-3 w-px bg-white/[0.07]" aria-hidden />

          <ol className="space-y-1">
            {STEPS.map((s, i) => {
              const isOpen = mobileOpen === i;
              return (
                <Reveal key={s.n} delay={0.04 + i * 0.04}>
                  <li data-step={i} className="relative">
                    <button
                      onClick={() => setMobileOpen(isOpen ? null : i)}
                      className="flex w-full items-start gap-5 py-6 text-left"
                    >
                      <div className="relative flex-shrink-0 pt-1.5">
                        <span
                          className={`block h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                            isOpen ? 'bg-brand-lime scale-125' : 'bg-brand-lime/20'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-4">
                          <span className={`font-mono text-[11px] tracking-[0.2em] transition-colors duration-300 ${isOpen ? 'text-brand-lime' : 'text-brand-orange/70'}`}>
                            {s.n}
                          </span>
                          <h3 className={`font-display text-xl font-extrabold leading-tight tracking-tight transition-colors duration-300 ${isOpen ? 'text-light' : 'text-light/60'}`}>
                            {s.title}
                          </h3>
                        </div>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <p className="text-sm leading-relaxed text-light/60">{s.desc}</p>
                              <div className="mt-3 h-px w-8 bg-brand-lime/40" />
                              <p className="mt-3 text-[13px] leading-relaxed text-light/45">{s.detail}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-sm transition-all duration-500 mt-0.5 ${
                          isOpen
                            ? 'rotate-45 border-brand-lime/60 text-brand-lime'
                            : 'border-white/15 text-light/40'
                        }`}
                      >
                        +
                      </span>
                    </button>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
