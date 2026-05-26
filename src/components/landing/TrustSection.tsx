'use client';

import { Reveal } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';

const stats = [
  { value: 120, suffix: '+', label: 'проектов' },
  { value: 4.8, decimals: 1, suffix: '×', label: 'средний ROAS' },
  { value: 90, suffix: '%', label: 'по рекомендациям' },
  { value: 7, suffix: '+', label: 'направлений' },
];

export function TrustSection() {
  return (
    <section className="relative w-full px-6 py-section lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        {/* Header: eyebrow + headline + caption — one tight row, two columns on lg */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-eyebrow uppercase text-brand-orange">
                Доверие в цифрах
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 max-w-[14ch] font-display text-hero-sm font-extrabold text-light">
                Цифры,{' '}
                <span className="font-serif italic font-normal text-lime-grad">
                  не обещания.
                </span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <p className="max-w-md text-base leading-relaxed text-light/55 lg:text-right">
              Восемь лет в performance-маркетинге. Среднее по нашим клиентам — без черри-пика.
            </p>
          </Reveal>
        </div>

        {/* Stats grid — divider rhythm, compact, premium */}
        <div className="mt-16 grid grid-cols-2 divide-x divide-y divide-white/[0.05] border-y border-white/[0.05] md:grid-cols-4 md:divide-y-0">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={0.08 + i * 0.06}>
              <div className="flex flex-col gap-3 px-6 py-10 md:px-8 md:py-12 lg:px-10">
                <div className="font-display text-5xl font-extrabold leading-none tracking-tight text-light md:text-6xl lg:text-7xl">
                  <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-light/45">
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
