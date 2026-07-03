'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

/**
 * Storytelling — premium pinned scroll with alternating-side principles.
 *
 *   Background (back → front)
 *     L0  subtle dot grid with center mask-fade so it never fights the wordmark
 *     L1  ambient purple + lime washes
 *     L2  side rails: hairline gradients + vertical micro-text
 *     L3  ambient particles + 5 phase decorations + drifting "mimi" wordmark
 *         with triple concentric orbits and N/S/E/W axis ticks
 *
 *   Foreground
 *     • top: section eyebrow + intro subtitle (fades in once on entry)
 *     • middle: 5 principle panels slide in from alternating sides with
 *       cross-fades; each panel = number, title, 2–3 sentence body
 *     • bottom: italic coda fades in during the last phase; phase ticker
 *       and scroll-driven progress bar
 */

type StoryCopy = { title: string; body: string[] };
type Story = StoryCopy & { n: string; side: 'right' | 'left' };

const STORY_META: { n: string; side: 'right' | 'left' }[] = [
  { n: '01', side: 'right' },
  { n: '02', side: 'left' },
  { n: '03', side: 'right' },
  { n: '04', side: 'left' },
  { n: '05', side: 'right' },
];

const ru = {
  intro: 'Минимизировать расходы предпринимателей на маркетинг и максимизировать их доход с медиаплощадок.',
  coda: 'меньше шума, больше смысла и ответственности.',
  eyebrow: 'наши принципы',
  ofTotal: 'из',
  stories: [
    { title: 'Умная эффективность', body: ['Мы не делаем «больше ради больше».', 'Каждое действие должно иметь смысл и результат.', 'Если что-то не работает — мы это убираем, даже если «так принято».'] },
    { title: 'Смелость мышления', body: ['Мы не копируем рынок и не боимся нестандартных решений.', 'В Mimi важно предлагать идеи, думать шире и брать ответственность за своё мнение.'] },
    { title: 'Премиальное отношение', body: ['Каждый проект — как наш собственный бренд.', 'Внимание к деталям, аккуратность и качество — это наш стандарт, а не дополнительная опция.'] },
    { title: 'Результат как репутация', body: ['Наше имя строится не на словах, а на кейсах.', 'То, что мы делаем сегодня, формирует то, как Mimi будут воспринимать завтра.'] },
    { title: 'Партнёрство', body: ['Мы не «исполнители задач».', 'Мы думаем вместе с клиентами и друг с другом, работаем на долгую и растём как команда.', 'Мы партнёр, а не подрядчик.'] },
  ] as StoryCopy[],
};
const en: typeof ru = {
  intro: 'Minimise entrepreneurs’ marketing spend and maximise their revenue from media channels.',
  coda: 'less noise, more meaning and responsibility.',
  eyebrow: 'our principles',
  ofTotal: 'of',
  stories: [
    { title: 'Smart efficiency', body: ['We don’t do «more for the sake of more».', 'Every action must carry meaning and a result.', 'If something doesn’t work, we remove it — even if it’s «the norm».'] },
    { title: 'Bold thinking', body: ['We don’t copy the market and aren’t afraid of unconventional decisions.', 'At Mimi it matters to propose ideas, think broader and own your opinion.'] },
    { title: 'Premium attitude', body: ['Every project is like our own brand.', 'Attention to detail, accuracy and quality are our standard, not an add-on.'] },
    { title: 'Results as reputation', body: ['Our name is built on cases, not words.', 'What we do today shapes how Mimi will be seen tomorrow.'] },
    { title: 'Partnership', body: ['We are not «task executors».', 'We think together with clients and with each other, work for the long run and grow as a team.', 'We are a partner, not a contractor.'] },
  ] as StoryCopy[],
};
const tg: typeof ru = {
  intro: 'Хароҷоти соҳибкоронро ба маркетинг кам карда, даромади онҳоро аз медиаплатформаҳо зиёд кунем.',
  coda: 'камтар садо, бештар маъно ва масъулият.',
  eyebrow: 'принсипҳои мо',
  ofTotal: 'аз',
  stories: [
    { title: 'Самаранокии оқилона', body: ['Мо «бештар ба хотири бештар» намекунем.', 'Ҳар амал бояд маъно ва натиҷа дошта бошад.', 'Агар чизе кор накунад — онро мебардорем, ҳатто агар «чунин қабул шуда бошад».'] },
    { title: 'Ҷасорати тафаккур', body: ['Мо бозорро нусхабардорӣ намекунем ва аз қарорҳои ғайристандартӣ наметарсем.', 'Дар Mimi пешниҳоди ғоя, васеътар фикр кардан ва масъулият барои фикри худ муҳим аст.'] },
    { title: 'Муносибати премиалӣ', body: ['Ҳар лоиҳа — ҳамчун бренди худи мо.', 'Диққат ба ҷузъиёт, дақиқӣ ва сифат — ин стандарти мост, на имконоти иловагӣ.'] },
    { title: 'Натиҷа ҳамчун обрӯ', body: ['Номи мо на бо суханон, балки бо кейсҳо сохта мешавад.', 'Он чи мо имрӯз мекунем, тарзи фардо қабул шудани Mimi-ро месозад.'] },
    { title: 'Шарикӣ', body: ['Мо «иҷрокунандаи вазифаҳо» нестем.', 'Мо якҷоя бо муштариён ва бо ҳамдигар фикр мекунем, дарозмуддат кор карда, ҳамчун даста рушд мекунем.', 'Мо шарик ҳастем, на пудратчӣ.'] },
  ] as StoryCopy[],
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

/* ─── 5 phase decorations (one brightens per active panel) ─── */
const Decorations = () => (
  <>
    {/* 01 — rising sparkline (efficiency) */}
    <div data-deco="0" className="absolute left-[12%] top-[18%]">
      <svg width="120" height="60" viewBox="0 0 120 60">
        <path d="M 0 50 L 30 38 L 60 30 L 90 18 L 120 6" stroke="#D4EC4C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="120" cy="6" r="3" fill="#D4EC4C" />
      </svg>
    </div>
    {/* 02 — bold bars (decisions) */}
    <div data-deco="1" className="absolute right-[10%] top-[20%]">
      <svg width="120" height="60" viewBox="0 0 120 60">
        {[
          { x: 0, h: 20 }, { x: 22, h: 32 }, { x: 44, h: 18 }, { x: 66, h: 44 }, { x: 88, h: 28 },
        ].map((b, i) => (
          <rect key={i} x={b.x} y={60 - b.h} width="14" height={b.h} rx="2" fill={i === 3 ? '#FC9603' : '#D4EC4C'} opacity={i === 3 ? 0.95 : 0.7} />
        ))}
      </svg>
    </div>
    {/* 03 — refined ring (premium) */}
    <div data-deco="2" className="absolute left-[14%] top-1/2 -translate-y-1/2">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#D4EC4C" strokeWidth="1.5" strokeDasharray="4 6" />
        <circle cx="40" cy="40" r="22" fill="none" stroke="#FC9603" strokeWidth="1" />
        <circle cx="40" cy="40" r="3" fill="#D4EC4C" />
      </svg>
    </div>
    {/* 04 — growth badge (result/reputation) */}
    <div data-deco="3" className="absolute right-[12%] top-1/2 -translate-y-1/2">
      <div className="flex flex-col items-end">
        <div className="font-display text-3xl font-extrabold leading-none text-brand-lime md:text-4xl"
          style={{ filter: 'drop-shadow(0 0 18px rgba(212,236,76,0.5))' }}
        >
          +312%
        </div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.32em] text-light/45">avg romi</div>
      </div>
    </div>
    {/* 05 — twin nodes (partnership) */}
    <div data-deco="4" className="absolute right-[18%] bottom-[18%]">
      <svg width="120" height="60" viewBox="0 0 120 60">
        <line x1="30" y1="30" x2="90" y2="30" stroke="#D4EC4C" strokeWidth="1" strokeDasharray="3 4" />
        <circle cx="30" cy="30" r="10" fill="none" stroke="#D4EC4C" strokeWidth="1.5" />
        <circle cx="30" cy="30" r="3" fill="#D4EC4C" />
        <circle cx="90" cy="30" r="10" fill="none" stroke="#FC9603" strokeWidth="1.5" />
        <circle cx="90" cy="30" r="3" fill="#FC9603" />
      </svg>
    </div>
  </>
);

/* ─── ambient particles for background depth ─── */
const Particles = () => (
  <>
    <div className="absolute left-[6%] bottom-[28%] h-1.5 w-1.5 rounded-full bg-brand-lime/40" />
    <div className="absolute right-[6%] top-[10%] h-1 w-1 rounded-full bg-brand-orange/60" />
    <div className="absolute left-[44%] bottom-[8%] h-1 w-1 rounded-full bg-brand-lime/30" />
    <div className="absolute left-[24%] top-[62%] h-0.5 w-0.5 rounded-full bg-brand-orange/50" />
    <div className="absolute right-[28%] top-[32%] h-1 w-1 rounded-full bg-brand-lime/25" />
    <div className="absolute left-[68%] bottom-[34%] h-0.5 w-0.5 rounded-full bg-brand-purpleLight/60" />
    <div className="absolute right-[38%] bottom-[22%] h-1 w-1 rounded-full bg-brand-lime/35" />
    <div className="absolute left-[32%] top-[24%] h-0.5 w-0.5 rounded-full bg-brand-orange/40" />
  </>
);

export function StorytellingScroll() {
  const t = useCopy(COPY);
  const STORIES: Story[] = STORY_META.map((m, i) => ({ ...m, ...t.stories[i] }));
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const mimiBgRef = useRef<HTMLDivElement>(null);
  const orbitsRef = useRef<SVGSVGElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tickerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const progressFillRef = useRef<HTMLSpanElement>(null);
  const decorationsWrapRef = useRef<HTMLDivElement>(null);
  const codaRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      panelRefs.current.forEach((p) => { if (p) gsap.set(p, { opacity: 1, x: 0 }); });
      return;
    }

    const ctx = gsap.context(() => {
      const N = STORIES.length;
      const PHASE = 1 / N;
      const CROSS = PHASE * 0.18;

      // ── Initial positions ──────────────────────────────────────
      panelRefs.current.forEach((p, i) => {
        if (!p) return;
        const off = STORIES[i].side === 'right' ? 480 : -480;
        gsap.set(p, { x: off, opacity: 0 });
      });

      const decos = decorationsWrapRef.current?.querySelectorAll<HTMLElement>('[data-deco]') ?? [];
      decos.forEach((d) => gsap.set(d, { opacity: 0.14, scale: 1 }));

      if (codaRef.current) gsap.set(codaRef.current, { opacity: 0, y: 8 });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=520%',
          pin: pinRef.current,
          pinSpacing: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ── PANELS: alternating side, cross-fade between phases ────
      STORIES.forEach((s, i) => {
        const panel = panelRefs.current[i];
        if (!panel) return;
        const off = s.side === 'right' ? 480 : -480;
        const phaseStart = i * PHASE;
        const phaseEnd = (i + 1) * PHASE;
        const enterDur = PHASE * 0.32;
        const exitDur = PHASE * 0.32;

        const enterAt = i === 0 ? 0 : phaseStart - CROSS;
        tl.to(panel, { x: 0, opacity: 1, duration: enterDur, ease: 'power3.out' }, enterAt);
        if (i < N - 1) {
          tl.to(panel, { x: off * 0.6, opacity: 0, duration: exitDur, ease: 'power3.in' }, phaseEnd - exitDur + CROSS);
        }
      });

      // ── BACKGROUND mimi wordmark: drifts on scroll ─────────────
      if (mimiBgRef.current) {
        tl.fromTo(
          mimiBgRef.current,
          { rotate: -3, scale: 0.94, yPercent: 3 },
          { rotate: 3, scale: 1.08, yPercent: -5, ease: 'none', duration: 1 },
          0,
        );
      }

      // ── ORBITS: slow counter-rotation for depth ───────────────
      if (orbitsRef.current) {
        tl.fromTo(orbitsRef.current, { rotate: 0 }, { rotate: 22, ease: 'none', duration: 1 }, 0);
      }

      // ── DECORATIONS: brighten in active phase, drift overall ──
      decos.forEach((deco, i) => {
        tl.fromTo(deco, { y: 0 }, { y: -28 + (i % 2) * 10, ease: 'none', duration: 1 }, 0);
        const phaseStart = i * PHASE;
        const phaseEnd = (i + 1) * PHASE;
        const fadeDur = PHASE * 0.32;
        tl.to(deco, { opacity: 1, scale: 1.08, duration: fadeDur, ease: 'power2.out' }, Math.max(0, phaseStart - CROSS));
        if (i < N - 1) {
          tl.to(deco, { opacity: 0.14, scale: 1, duration: fadeDur, ease: 'power2.in' }, phaseEnd - fadeDur + CROSS);
        }
      });

      // ── PROGRESS BAR + TICKER ──────────────────────────────────
      if (progressFillRef.current) {
        tl.fromTo(progressFillRef.current, { width: '0%' }, { width: '100%', ease: 'none', duration: 1 }, 0);
      }
      tickerRefs.current.forEach((tick, i) => {
        if (!tick) return;
        const start = i * PHASE;
        const end = (i + 1) * PHASE;
        const tickDur = PHASE * 0.22;
        tl.to(tick, { color: '#D4EC4C', duration: tickDur, ease: 'power2.out' }, Math.max(0, start - CROSS * 0.5));
        if (i < N - 1) {
          tl.to(tick, { color: 'rgba(245,241,250,0.25)', duration: tickDur, ease: 'power2.in' }, end - tickDur + CROSS * 0.5);
        }
      });

      // ── CODA: fades in as the last phase begins ────────────────
      if (codaRef.current) {
        tl.to(
          codaRef.current,
          { opacity: 1, y: 0, duration: PHASE * 0.5, ease: 'power2.out' },
          (N - 1) * PHASE,
        );
      }
    }, sectionRef);

    document.fonts?.ready?.then(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full">
      <div ref={pinRef} className="relative h-screen w-full overflow-hidden">
        {/* ── BG L0: subtle dot grid (mask-faded around the wordmark) ── */}
        <div
          className="pointer-events-none absolute inset-0 grid-dots opacity-50"
          style={{
            maskImage: 'radial-gradient(ellipse 55% 50% at center, transparent 0%, #000 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 55% 50% at center, transparent 0%, #000 75%)',
          }}
        />

        {/* ── BG L1: ambient washes ── */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[70vh] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/22 blur-3xl" />
          <div className="absolute right-[-5%] top-[10%] h-[40vh] w-[40vw] rounded-full bg-brand-lime/[0.04] blur-3xl" />
          <div className="absolute left-[-10%] bottom-[20%] h-[35vh] w-[40vw] rounded-full bg-brand-purple/[0.15] blur-3xl" />
        </div>

        {/* ── BG L2: side rails ── */}
        <div className="pointer-events-none absolute inset-y-0 left-4 z-10 hidden lg:block">
          <div className="absolute top-[18%] bottom-[18%] left-0 w-px bg-gradient-to-b from-transparent via-brand-lime/15 to-transparent" />
          <div
            className="absolute top-1/2 left-2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.36em] text-light/25"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            mimi · principles
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-4 z-10 hidden lg:block">
          <div className="absolute top-[18%] bottom-[18%] right-0 w-px bg-gradient-to-b from-transparent via-brand-purpleLight/25 to-transparent" />
          <div
            className="absolute top-1/2 right-2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.36em] text-light/25"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            01 / 2026
          </div>
        </div>

        {/* ── BG L3: particles + decorations + mimi wordmark with orbits ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Particles />
          <div ref={decorationsWrapRef} className="absolute inset-0">
            <Decorations />
          </div>

          {/* mimi wordmark + concentric orbits */}
          <div
            ref={mimiBgRef}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className="relative flex items-baseline font-display font-extrabold leading-none tracking-[-0.06em]"
              style={{
                fontSize: 'clamp(8rem, 24vw, 22rem)',
                color: 'rgba(212,236,76,0.10)',
                filter: 'drop-shadow(0 0 60px rgba(212,236,76,0.18))',
              }}
            >
              {/* dotless ı — quiet, clean watermark */}
              <span>m</span>
              <span>ı</span>
              <span>m</span>
              <span>ı</span>
            </div>
            {/* triple orbit + axis ticks + cardinal dots (counter-rotates on scroll) */}
            <svg
              ref={orbitsRef}
              viewBox="0 0 800 800"
              className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 will-change-transform"
            >
              <circle cx="400" cy="400" r="360" fill="none" stroke="rgba(212,236,76,0.08)" strokeWidth="0.6" strokeDasharray="3 8" />
              <circle cx="400" cy="400" r="290" fill="none" stroke="rgba(91,60,163,0.18)" strokeWidth="0.4" />
              <circle cx="400" cy="400" r="220" fill="none" stroke="rgba(212,236,76,0.06)" strokeWidth="0.4" strokeDasharray="1 5" />
              {/* N S E W tick marks */}
              <line x1="400" y1="32" x2="400" y2="68" stroke="rgba(212,236,76,0.22)" strokeWidth="0.8" />
              <line x1="400" y1="732" x2="400" y2="768" stroke="rgba(212,236,76,0.22)" strokeWidth="0.8" />
              <line x1="32" y1="400" x2="68" y2="400" stroke="rgba(91,60,163,0.3)" strokeWidth="0.8" />
              <line x1="732" y1="400" x2="768" y2="400" stroke="rgba(91,60,163,0.3)" strokeWidth="0.8" />
              {/* cardinal dots */}
              <circle cx="400" cy="40" r="2" fill="#D4EC4C" opacity="0.45" />
              <circle cx="400" cy="760" r="2" fill="#D4EC4C" opacity="0.35" />
              <circle cx="40" cy="400" r="2" fill="#5B3CA3" opacity="0.55" />
              <circle cx="760" cy="400" r="2" fill="#5B3CA3" opacity="0.55" />
            </svg>
          </div>
        </div>

        {/* ── FG: top header with intro subtitle ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="absolute left-1/2 top-[7%] z-20 w-full max-w-2xl -translate-x-1/2 px-6 text-center"
        >
          <p className="flex items-center justify-center gap-3 text-eyebrow uppercase text-brand-orange">
            <span className="h-px w-10 bg-brand-orange/60" />
            {t.eyebrow}
            <span className="h-px w-10 bg-brand-orange/60" />
          </p>
          <p className="mx-auto mt-5 max-w-md text-[13px] leading-relaxed text-light/50 md:text-[14px]">
            {t.intro}
          </p>
        </motion.div>

        {/* ── FG: alternating-side principle panels ── */}
        <div className="absolute inset-0 z-20 flex items-center px-6 lg:px-16">
          <div className="relative mx-auto w-full max-w-[1500px]">
            {STORIES.map((s, i) => (
              <div
                key={s.n}
                ref={(el) => { panelRefs.current[i] = el; }}
                className={`absolute top-1/2 -translate-y-1/2 max-w-[480px] will-change-transform ${
                  s.side === 'right' ? 'right-0 text-left' : 'left-0 text-left'
                }`}
              >
                <div className="flex items-center gap-4 text-eyebrow uppercase">
                  <span className="font-mono text-brand-lime">{s.n}</span>
                  <span className="h-px w-14 bg-brand-lime/40" />
                  <span className="text-light/45">{t.ofTotal} 05</span>
                </div>
                <h3 className="mt-7 max-w-[16ch] font-display text-hero-sm font-extrabold text-light">
                  {s.title}
                </h3>
                <div className="mt-6 max-w-[44ch] space-y-2.5 text-[15px] leading-[1.55] text-light/70">
                  {s.body.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FG: coda + ticker + progress (bottom) ── */}
        <div className="absolute inset-x-6 bottom-10 z-20 lg:inset-x-16">
          <div className="mx-auto max-w-[1500px]">
            <p
              ref={codaRef}
              className="mb-7 text-center font-serif italic text-light/55 text-[13px] md:text-[14px]"
            >
              {t.coda}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-baseline gap-4 font-mono text-[11px] uppercase tracking-[0.32em]">
                {STORIES.map((s, i) => (
                  <span
                    key={s.n}
                    ref={(el) => { tickerRefs.current[i] = el; }}
                    className="transition-colors duration-300"
                    style={{ color: i === 0 ? '#D4EC4C' : 'rgba(245,241,250,0.25)' }}
                  >
                    {s.n}
                  </span>
                ))}
              </div>
              <span className="relative h-px flex-1 bg-white/[0.08]">
                <span
                  ref={progressFillRef}
                  className="absolute inset-y-0 left-0 block w-0 bg-gradient-to-r from-brand-lime to-brand-orange"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
