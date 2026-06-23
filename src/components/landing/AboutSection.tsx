'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { Reveal } from '@/components/ui/Reveal';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

/**
 * About — signature animation: word-by-word reveal driven by scroll position.
 * Each word lifts from black to full opacity as it passes the scroll midpoint.
 */
const ru = {
  eyebrow: 'О нас',
  lineA: 'Мы не запускаем рекламу.',
  lineB: 'Мы строим систему роста.',
  para: 'MIMI помогает бизнесу избавиться от хаоса в маркетинге и превратить продвижение в понятную систему результата.',
};
const en: typeof ru = {
  eyebrow: 'About',
  lineA: 'We don’t just run ads.',
  lineB: 'We build a growth system.',
  para: 'MIMI helps businesses get rid of marketing chaos and turn promotion into a clear system of results.',
};
const tg: typeof ru = {
  eyebrow: 'Дар бораи мо',
  lineA: 'Мо танҳо реклама роҳандозӣ намекунем.',
  lineB: 'Мо системаи рушдро месозем.',
  para: 'MIMI ба бизнес кӯмак мекунад, ки аз бесарусомонии маркетингӣ халос шуда, пешбариро ба системаи фаҳмои натиҷа табдил диҳад.',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export function AboutSection() {
  const t = useCopy(COPY);
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      wordsRef.current.forEach((w) => w && gsap.set(w, { opacity: 1 }));
      return;
    }
    const ctx = gsap.context(() => {
      gsap.set(wordsRef.current, { opacity: 0.15 });
      gsap.to(wordsRef.current, {
        opacity: 1,
        stagger: { each: 0.06, from: 'start' },
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          end: 'bottom 40%',
          scrub: 0.8,
        },
      });
    }, sectionRef);
    document.fonts?.ready?.then(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, []);

  const words = (line: string, offset: number, isAccent = false) =>
    line.split(' ').map((w, i) => (
      <span
        key={`${offset}-${i}`}
        ref={(el) => { if (el) wordsRef.current[offset + i] = el; }}
        className={isAccent ? 'text-lime-grad' : 'text-light'}
        style={{ display: 'inline-block', marginRight: '0.32em' }}
      >
        {w}
      </span>
    ));

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full px-6 py-section lg:px-12"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purpleLight/8 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-left md:text-center">
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.5em] text-brand-orange">{t.eyebrow}</p>
        </Reveal>

        <h2 className="mt-12 font-display text-hero-sm font-extrabold leading-[1.05] tracking-tight">
          {words(t.lineA, 0)}
          <br />
          {words(t.lineB, t.lineA.split(' ').length, true)}
        </h2>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-12 max-w-xl text-lg leading-relaxed text-light/65 md:text-xl">
            {t.para}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
