'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { Reveal } from '@/components/ui/Reveal';

/**
 * About — signature animation: word-by-word reveal driven by scroll position.
 * Each word lifts from black to full opacity as it passes the scroll midpoint.
 */
const LINE_A = 'Мы не запускаем рекламу.';
const LINE_B = 'Мы строим систему роста.';

export function AboutSection() {
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
          <p className="text-[10px] uppercase tracking-[0.5em] text-brand-orange">О нас</p>
        </Reveal>

        <h2 className="mt-12 font-display text-hero-sm font-extrabold leading-[1.05] tracking-tight">
          {words(LINE_A, 0)}
          <br />
          {words(LINE_B, LINE_A.split(' ').length, true)}
        </h2>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-12 max-w-xl text-lg leading-relaxed text-light/65 md:text-xl">
            MIMI помогает бизнесу избавиться от хаоса в маркетинге и превратить
            продвижение в понятную систему результата.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
