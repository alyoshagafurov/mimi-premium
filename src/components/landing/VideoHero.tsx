'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

const ru = {
  titlePre: 'Минимизируем шум',
  titleEmphasis: 'Максимизируем',
  titlePost: 'узнаваемость',
  subtitle: 'Системный маркетинг в Таджикистане для бизнеса, который хочет расти без хаоса и лишних затрат.',
  ctaPrimary: 'Получить аудит',
  ctaSecondary: 'Смотреть кейсы',
  stat1: '+14 проектов',
  stat3: '50% по рекомендациям',
};
const en: typeof ru = {
  titlePre: 'We minimise noise',
  titleEmphasis: 'Maximise',
  titlePost: 'recognition',
  subtitle: 'Systematic marketing in Tajikistan for businesses that want to grow without chaos and wasted spend.',
  ctaPrimary: 'Get an audit',
  ctaSecondary: 'View cases',
  stat1: '+14 projects',
  stat3: '50% by referral',
};
const tg: typeof ru = {
  titlePre: 'Садоро кам мекунем',
  titleEmphasis: 'Шинохтро',
  titlePost: 'зиёд мекунем',
  subtitle: 'Маркетинги системавӣ дар Тоҷикистон барои бизнесе, ки бе бесарусомонӣ ва хароҷоти зиёдатӣ рушд карданӣ аст.',
  ctaPrimary: 'Гирифтани аудит',
  ctaSecondary: 'Дидани кейсҳо',
  stat1: '+14 лоиҳа',
  stat3: '50% бо тавсия',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

/**
 * mimi Hero — mouse-reactive aurora.
 *
 *   LEFT  → compact label + headline + subhead + 2 magnetic CTAs
 *   RIGHT → full mimi wordmark (lime letters + two orange dots) framed by
 *           slow orbital rings, surrounded by 3 floating accent gems.
 *
 * Mouse parallax drives independent lerps on:
 *   • two aurora blobs (purple + lime)
 *   • a cursor spotlight (1:1 lime soft circle)
 *   • the central wordmark (subtle tilt)
 *   • three floating gems (each at its own depth)
 *
 * Pure CSS + SVG — no images, no video.
 */
export function VideoHero() {
  const t = useCopy(COPY);
  const sectionRef = useRef<HTMLElement>(null);
  const auroraARef = useRef<HTMLDivElement>(null);
  const auroraBRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const gem3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let tx = 0, ty = 0;
    const layers = {
      auroraA: { x: 0, y: 0, k: 0.04, mult: 60 },
      auroraB: { x: 0, y: 0, k: 0.06, mult: 90 },
      word:    { x: 0, y: 0, k: 0.07, mult: 14 },
      gem3:    { x: 0, y: 0, k: 0.10, mult: 22 },
    };
    let spotPX = 0, spotPY = 0;
    let frame = 0;

    const onMove = (e: MouseEvent) => {
      const r = root.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      tx = Math.max(-1, Math.min(1, nx));
      ty = Math.max(-1, Math.min(1, ny));
      spotPX = e.clientX - r.left;
      spotPY = e.clientY - r.top;
    };
    root.addEventListener('mousemove', onMove);

    const apply = (
      el: HTMLElement | null,
      layer: { x: number; y: number; k: number; mult: number },
      extra = '',
    ) => {
      if (!el) return;
      layer.x += (tx - layer.x) * layer.k;
      layer.y += (ty - layer.y) * layer.k;
      el.style.transform = `translate3d(${layer.x * layer.mult}px, ${layer.y * layer.mult}px, 0) ${extra}`;
    };

    const tick = () => {
      apply(auroraARef.current, layers.auroraA);
      apply(auroraBRef.current, layers.auroraB);
      apply(wordRef.current, layers.word, `rotateY(${layers.word.x * 5}deg) rotateX(${-layers.word.y * 3.5}deg)`);
      apply(gem3Ref.current, layers.gem3, 'rotate(38deg)');
      if (spotRef.current) {
        spotRef.current.style.setProperty('--sx', `${spotPX}px`);
        spotRef.current.style.setProperty('--sy', `${spotPY}px`);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      root.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] w-full overflow-hidden px-6 pt-32 pb-20 lg:px-12 lg:pt-36 lg:pb-24"
    >
      {/* background layers */}
      <div className="pointer-events-none absolute inset-0 -z-30 grid-dots opacity-25" />
      <div className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute -top-32 left-[5%] h-[60vh] w-[55vw] rounded-full bg-brand-purple/22 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[5%] h-[40vh] w-[40vw] rounded-full bg-brand-lime/[0.05] blur-3xl" />
      </div>
      <div
        ref={auroraARef}
        aria-hidden
        className="pointer-events-none absolute left-[20%] top-[25%] -z-10 h-[55vh] w-[55vw] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgba(91,60,163,0.55) 0%, rgba(60,25,117,0.15) 45%, transparent 75%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        ref={auroraBRef}
        aria-hidden
        className="pointer-events-none absolute right-[20%] bottom-[20%] -z-10 h-[35vh] w-[35vw] translate-x-1/2 translate-y-1/2 rounded-full will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgba(212,236,76,0.18) 0%, rgba(212,236,76,0.05) 45%, transparent 75%)',
          filter: 'blur(50px)',
        }}
      />
      <div
        ref={spotRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(420px circle at var(--sx, 50%) var(--sy, 30%), rgba(212,236,76,0.10), transparent 60%)',
          transition: 'background 0.05s linear',
        }}
      />
      <span className="pointer-events-none absolute inset-x-0 top-[68px] -z-10 h-px bg-gradient-to-r from-transparent via-brand-lime/30 to-transparent" />

      <div className="relative mx-auto grid w-full max-w-[1500px] grid-cols-1 items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        {/* LEFT — TEXT */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 text-eyebrow uppercase text-brand-orange"
          >
            <span className="h-px w-10 bg-brand-orange/60" />
            minimise marketing agency 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-[22ch] font-display text-hero font-extrabold text-light"
          >
            {t.titlePre}
            <br />
            <span className="font-serif italic font-normal text-lime-grad">
              {t.titleEmphasis}
            </span>{' '}
            <span className="text-light">{t.titlePost}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45 }}
            className="mt-7 max-w-[46ch] text-[15px] leading-[1.7] text-light/65"
          >
            {t.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.65 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <MagneticButton href="https://wa.me/992070217755" variant="lime" arrow>
              {t.ctaPrimary}
            </MagneticButton>
            <MagneticButton href="#cases" variant="ghost">
              {t.ctaSecondary}
            </MagneticButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, delay: 1.0 }}
            className="mt-14 hidden flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[10px] uppercase tracking-[0.24em] text-light/40 md:flex"
          >
            <span>{t.stat1}</span>
            <span className="h-px w-6 bg-light/15" />
            <span>4.8 ROAS</span>
            <span className="h-px w-6 bg-light/15" />
            <span>{t.stat3}</span>
          </motion.div>
        </div>

        {/* RIGHT — mimi WORDMARK with orbital halo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-square w-full max-w-[480px]"
          style={{ perspective: '1800px' }}
        >
          {/* Ornament — central-asian pattern framing the wordmark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.img
              src="/ornament.png"
              alt=""
              aria-hidden
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 240, repeat: Infinity, ease: 'linear' }}
              className="h-[118%] w-[118%] max-w-none select-none opacity-[0.22]"
              style={{ filter: 'drop-shadow(0 0 50px rgba(252,150,3,0.22))' }}
            />
          </div>

          {/* Floating accent gem — depth via mouse parallax */}
          <div
            ref={gem3Ref}
            aria-hidden
            className="absolute bottom-[6%] right-[14%] h-11 w-11 will-change-transform"
            style={{
              background: 'linear-gradient(135deg, rgba(130,103,200,0.85), rgba(60,25,117,0.45))',
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              filter: 'drop-shadow(0 0 18px rgba(91,60,163,0.5))',
            }}
          />

          {/* Orbital rings (slow rotation) */}
          <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="hero-ring-a" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D4EC4C" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#5B3CA3" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <motion.circle
              cx="200"
              cy="200"
              r="186"
              fill="none"
              stroke="url(#hero-ring-a)"
              strokeWidth="0.9"
              strokeDasharray="3 8"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '200px 200px' }}
            />
            <motion.circle
              cx="200"
              cy="200"
              r="158"
              fill="none"
              stroke="rgba(212,236,76,0.16)"
              strokeWidth="0.6"
              initial={{ rotate: 0 }}
              animate={{ rotate: -360 }}
              transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '200px 200px' }}
            />
            <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          </svg>

          {/* Soft halo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(closest-side, rgba(212,236,76,0.22) 0%, rgba(91,60,163,0.18) 40%, transparent 70%)',
              filter: 'blur(22px)',
            }}
          />

          {/* WORDMARK — full "mimi" */}
          <div
            ref={wordRef}
            className="absolute inset-0 flex items-center justify-center will-change-transform"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="relative flex items-baseline font-display text-[6.5rem] font-extrabold leading-none tracking-[-0.06em] text-brand-lime md:text-[8.5rem]"
              style={{ filter: 'drop-shadow(0 0 26px rgba(212,236,76,0.42))' }}
            >
              {/* m ı m ı — dotless i for a clean, quiet wordmark */}
              <span>m</span>
              <span>ı</span>
              <span>m</span>
              <span>ı</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.3 }}
        className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[9px] uppercase tracking-[0.42em] text-light/45"
      >
        <span>scroll</span>
        <motion.span
          animate={{ scaleY: [1, 0.35, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="h-10 w-px origin-top bg-gradient-to-b from-brand-lime to-transparent"
        />
      </motion.div>
    </section>
  );
}
