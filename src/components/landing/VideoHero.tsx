'use client';

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
 * mimi Hero — static aurora + wordmark.
 *
 * Content is rendered VISIBLE by default and only enhanced with a lightweight
 * CSS fade-up (`.reveal`). No framer-motion, no rAF loops, no infinite
 * rotations — so the hero paints instantly on every browser and never sits
 * blank waiting for JS, and it adds no continuous work to the main thread.
 */
export function VideoHero() {
  const t = useCopy(COPY);

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden px-6 pt-32 pb-20 lg:px-12 lg:pt-36 lg:pb-24">
      {/* background layers (static — painted once) */}
      <div className="pointer-events-none absolute inset-0 -z-30 grid-dots opacity-25" />
      <div className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute -top-32 left-[5%] h-[60vh] w-[55vw] rounded-full bg-brand-purple/22 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[5%] h-[40vh] w-[40vw] rounded-full bg-brand-lime/[0.05] blur-3xl" />
        <div
          aria-hidden
          className="absolute left-[20%] top-[25%] h-[55vh] w-[55vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(91,60,163,0.42) 0%, rgba(60,25,117,0.12) 45%, transparent 75%)',
            filter: 'blur(40px)',
          }}
        />
      </div>
      <span className="pointer-events-none absolute inset-x-0 top-[68px] -z-10 h-px bg-gradient-to-r from-transparent via-brand-lime/30 to-transparent" />

      <div className="relative mx-auto grid w-full max-w-[1500px] grid-cols-1 items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        {/* LEFT — TEXT */}
        <div>
          <div className="reveal flex items-center gap-3 text-eyebrow uppercase text-brand-orange">
            <span className="h-px w-10 bg-brand-orange/60" />
            minimise marketing agency 2026
          </div>

          <h1 className="reveal reveal-d1 mt-7 max-w-[22ch] font-display text-hero font-extrabold text-light">
            {t.titlePre}
            <br />
            <span className="font-serif italic font-normal text-lime-grad">{t.titleEmphasis}</span>{' '}
            <span className="text-light">{t.titlePost}</span>
          </h1>

          <p className="reveal reveal-d2 mt-7 max-w-[46ch] text-[15px] leading-[1.7] text-light/65">
            {t.subtitle}
          </p>

          <div className="reveal reveal-d3 mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton href="https://wa.me/992070217755" variant="lime" arrow>
              {t.ctaPrimary}
            </MagneticButton>
            <MagneticButton href="/cases" variant="ghost">
              {t.ctaSecondary}
            </MagneticButton>
          </div>

          <div className="reveal reveal-d4 mt-14 hidden flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[10px] uppercase tracking-[0.24em] text-light/40 md:flex">
            <span>{t.stat1}</span>
            <span className="h-px w-6 bg-light/15" />
            <span>4.8 ROAS</span>
            <span className="h-px w-6 bg-light/15" />
            <span>{t.stat3}</span>
          </div>
        </div>

        {/* RIGHT — mimi WORDMARK with static halo */}
        <div className="reveal reveal-d2 relative mx-auto aspect-square w-full max-w-[480px]">
          {/* Ornament — central-asian pattern framing the wordmark (static) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ornament.webp"
              alt=""
              aria-hidden
              width={1024}
              height={1024}
              loading="eager"
              decoding="async"
              className="h-[118%] w-[118%] max-w-none select-none opacity-[0.20]"
            />
          </div>

          {/* Orbital rings (static) */}
          <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="hero-ring-a" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D4EC4C" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#5B3CA3" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="200" r="186" fill="none" stroke="url(#hero-ring-a)" strokeWidth="0.9" strokeDasharray="3 8" />
            <circle cx="200" cy="200" r="158" fill="none" stroke="rgba(212,236,76,0.16)" strokeWidth="0.6" />
            <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          </svg>

          {/* Soft halo (static) */}
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative font-display text-[6.5rem] font-extrabold leading-none tracking-[-0.06em] text-brand-lime md:text-[8.5rem]"
              style={{ filter: 'drop-shadow(0 0 26px rgba(212,236,76,0.42))' }}
            >
              mimi
            </div>
          </div>
        </div>
      </div>

      {/* scroll hint (static) */}
      <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[9px] uppercase tracking-[0.42em] text-light/45">
        <span>scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-brand-lime to-transparent" />
      </div>
    </section>
  );
}
