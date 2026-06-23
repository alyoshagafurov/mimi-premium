'use client';

import { Reveal } from '@/components/ui/Reveal';

/**
 * Channels — horizontal infinite marquee with the ad platforms we run.
 *
 * CSS-only animation, duplicated tracks for seamless loop, edge mask-fade.
 */
const CHANNELS = [
  { name: 'Meta', glyph: 'M' },
  { name: 'Instagram', glyph: 'IG' },
  { name: 'Facebook', glyph: 'f' },
  { name: 'Google Ads', glyph: 'G' },
  { name: 'YouTube', glyph: 'YT' },
  { name: 'TikTok', glyph: 'TT' },
  { name: 'VK', glyph: 'VK' },
  { name: 'Telegram', glyph: 'TG' },
  { name: 'Яндекс.Директ', glyph: 'Я' },
  { name: 'Snapchat', glyph: 'SC' },
];

function Track() {
  return (
    <div className="flex shrink-0 items-center gap-10 px-5">
      {CHANNELS.map((c) => (
        <div key={c.name} className="flex shrink-0 items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-lime/30 bg-brand-lime/[0.05] font-display text-[11px] font-bold text-brand-lime">
            {c.glyph}
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight text-light/85 md:text-2xl">
            {c.name}
          </span>
          <span className="text-light/15">/</span>
        </div>
      ))}
    </div>
  );
}

export function ChannelsSection() {
  return (
    <section
      id="channels"
      className="relative w-full border-y border-white/[0.05] py-section"
    >
      {/* Header — same rhythm as the other sections */}
      <div className="mx-auto mb-14 max-w-[1500px] px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-eyebrow uppercase text-brand-orange">Каналы</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 max-w-[14ch] font-display text-hero-sm font-extrabold">
                Везде,{' '}
                <span className="font-serif italic font-normal text-lime-grad">где платят.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <p className="max-w-md text-base leading-relaxed text-light/55 lg:text-right">
              Десять платформ, одна стратегия. Подключаем те, что подходят бизнесу — без маркетингового хаоса.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Marquee — two tracks for layered depth, edge mask-fade for seamless seam */}
      <div
        className="relative overflow-hidden"
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)',
          maskImage:
            'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)',
        }}
      >
        <div className="flex animate-[scroll-x_42s_linear_infinite] py-3">
          <Track />
          <Track />
          <Track />
        </div>
      </div>
      <div
        className="relative mt-2 overflow-hidden"
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)',
          maskImage:
            'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)',
        }}
      >
        <div className="flex animate-[scroll-x-rev_52s_linear_infinite] py-3 opacity-40">
          <Track />
          <Track />
          <Track />
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-x {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.3333%); }
        }
        @keyframes scroll-x-rev {
          from { transform: translateX(-33.3333%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
