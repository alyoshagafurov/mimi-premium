'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Cases — signature: SVG growth line draws itself on scroll inside each card.
 */
const cases = [
  {
    n: '01',
    niche: 'Эстетическая медицина',
    metric: '+320%',
    metricLabel: 'ROMI',
    desc: 'Сеть клиник в 4 городах. Перестроили воронку, заменили креативы, подключили сквозную аналитику.',
    // path describes an ascending curve
    path: 'M 0 90 C 60 80, 110 88, 170 65 S 250 35, 320 12',
  },
  {
    n: '02',
    niche: 'Премиум фитнес',
    metric: '×3',
    metricLabel: 'рост заявок',
    desc: 'Студия персональных тренировок. От 40 до 120+ заявок в месяц при сниженном CAC.',
    path: 'M 0 88 L 60 78 L 120 70 L 180 52 L 240 30 L 320 10',
  },
  {
    n: '03',
    niche: 'Премиум недвижимость',
    metric: '−47%',
    metricLabel: 'стоимость лида',
    desc: 'Девелопер новостроек. Переориентация на тёплый интент снизила CPL почти вдвое.',
    // descending curve (price going down)
    path: 'M 0 20 C 80 30, 140 50, 200 65 S 280 88, 320 92',
  },
];

function CaseChart({ d, color = '#D4EC4C' }: { d: string; color?: string }) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = pathRef.current;
    if (!el) return;
    const length = el.getTotalLength();
    gsap.set(el, { strokeDasharray: length, strokeDashoffset: reduce ? 0 : length });
    if (reduce) return;
    const tw = gsap.to(el, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 60%', scrub: 0.8 },
    });
    return () => { tw.scrollTrigger?.kill(); tw.kill(); };
  }, []);

  return (
    <svg viewBox="0 0 320 100" className="h-20 w-full">
      <defs>
        <linearGradient id={`case-${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={`url(#case-${color.replace('#', '')})`}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CasesSection() {
  return (
    <section id="cases" className="relative w-full border-y border-white/[0.05] px-6 py-section lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.5em] text-brand-orange">Кейсы</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 max-w-[14ch] font-display text-hero-sm font-extrabold">
                Результаты,{' '}
                <span className="font-serif italic font-normal text-lime-grad">
                  не обещания.
                </span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <p className="max-w-md text-base leading-relaxed text-light/55 lg:text-right">
              Короткие истории. Подробности — по запросу под NDA.
            </p>
          </Reveal>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-white/[0.05] md:grid-cols-3">
          {cases.map((c, i) => (
            <Reveal key={c.n} delay={0.1 + i * 0.1}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex h-full flex-col justify-between bg-ink p-10 md:p-12"
              >
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-xs font-medium text-brand-orange">{c.n}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-light/40">{c.niche}</span>
                  </div>
                  <p className="mt-12 font-display text-7xl font-extrabold leading-none tracking-tight text-lime-grad md:text-8xl">
                    {c.metric}
                  </p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-light/55">
                    {c.metricLabel}
                  </p>

                  {/* signature: draw-on-scroll growth path */}
                  <div className="mt-10">
                    <CaseChart d={c.path} color={i === 2 ? '#FC9603' : '#D4EC4C'} />
                  </div>
                </div>
                <p className="mt-10 max-w-[26ch] text-sm leading-relaxed text-light/55">{c.desc}</p>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
