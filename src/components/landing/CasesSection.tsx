'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { Reveal } from '@/components/ui/Reveal';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

/**
 * Cases — signature: SVG growth line draws itself on scroll inside each card.
 */
const CASE_META = [
  { n: '01', metric: '+2459%', path: 'M 0 90 C 60 80, 110 88, 170 65 S 250 35, 320 12' },
  { n: '02', metric: '−60%', path: 'M 0 20 C 80 30, 140 50, 200 65 S 280 88, 320 92' },
  { n: '03', metric: '×4', path: 'M 0 88 L 60 78 L 120 70 L 180 52 L 240 30 L 320 10' },
];
type CaseCopy = { niche: string; metricLabel: string; desc: string };

const ru = {
  eyebrow: 'Кейсы',
  titlePre: 'Результаты,',
  titleEmphasis: 'не обещания.',
  subtitle: 'Короткие истории. Подробности — по запросу под NDA.',
  cases: [
    { niche: 'Магазин спорттоваров', metricLabel: 'ROMI', desc: 'Открылась новая точка. С нуля подняли маркетинговую систему. В первый же месяц маркетинг окупил себя ×25: на каждый 1 сомони рекламы — 25,5 сомони выручки.' },
    { niche: 'Врач-флеболог', metricLabel: 'стоимость лида', desc: 'Снизили CPL до −60% и улучшили качество лидов. В первый же месяц маркетинг окупился ×3.' },
    { niche: 'Визово-консалтинговое агентство', metricLabel: 'выручка отдела продаж', desc: 'Выстроили воронку, CRM и контроль продаж. Стабилизировали поток: с 30 до 140+ заявок в день. За первые два месяца подняли выручку отдела продаж ×4 — без учёта up-sell.' },
  ] as CaseCopy[],
};
const en: typeof ru = {
  eyebrow: 'Cases',
  titlePre: 'Results,',
  titleEmphasis: 'not promises.',
  subtitle: 'Short stories. Details on request under NDA.',
  cases: [
    { niche: 'Sporting-goods store', metricLabel: 'ROMI', desc: 'A new store opened. We built the marketing system from scratch. In the very first month marketing paid for itself ×25: for every 1 somoni of ads — 25.5 somoni of revenue.' },
    { niche: 'Phlebologist', metricLabel: 'cost per lead', desc: 'We cut CPL by −60% and improved lead quality. In the very first month marketing paid for itself ×3.' },
    { niche: 'Visa & consulting agency', metricLabel: 'sales-team revenue', desc: 'We built the funnel, CRM and sales control. Stabilised the flow: from 30 to 140+ leads a day. In the first two months we grew the sales-team revenue ×4 — excluding up-sell.' },
  ] as CaseCopy[],
};
const tg: typeof ru = {
  eyebrow: 'Кейсҳо',
  titlePre: 'Натиҷаҳо,',
  titleEmphasis: 'на ваъдаҳо.',
  subtitle: 'Ҳикояҳои кӯтоҳ. Тафсилот — бо дархост таҳти NDA.',
  cases: [
    { niche: 'Мағозаи молҳои варзишӣ', metricLabel: 'ROMI', desc: 'Нуқтаи нав кушода шуд. Системаи маркетингро аз сифр сохтем. Дар моҳи аввал маркетинг худро ×25 пӯшонд: барои ҳар 1 сомонии реклама — 25,5 сомонӣ даромад.' },
    { niche: 'Духтури флеболог', metricLabel: 'арзиши лид', desc: 'CPL-ро то −60% кам карда, сифати лидҳоро беҳтар кардем. Дар моҳи аввал маркетинг ×3 худро пӯшонд.' },
    { niche: 'Агентии виза ва консалтинг', metricLabel: 'даромади шуъбаи фурӯш', desc: 'Воронка, CRM ва назорати фурӯшро сохтем. Ҷараёнро устувор кардем: аз 30 то 140+ заявка дар рӯз. Дар ду моҳи аввал даромади шуъбаи фурӯшро ×4 баланд бардоштем — бе ҳисоби up-sell.' },
  ] as CaseCopy[],
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

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
  const t = useCopy(COPY);
  const cases = CASE_META.map((m, i) => ({ ...m, ...t.cases[i] }));
  return (
    <section id="cases" className="relative w-full border-y border-white/[0.05] px-6 py-section lg:px-12">
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
                  <p className="mt-12 font-display text-[clamp(2.75rem,7vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-lime-grad">
                    {c.metric}
                  </p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-light/55">
                    {c.metricLabel}
                  </p>

                  {/* signature: draw-on-scroll growth path */}
                  <div className="mt-10">
                    <CaseChart d={c.path} color={i === 1 ? '#FC9603' : '#D4EC4C'} />
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
