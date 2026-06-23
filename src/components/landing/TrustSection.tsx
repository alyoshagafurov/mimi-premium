'use client';

import { Reveal } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

const ru = {
  eyebrow: 'Доверие в цифрах',
  titlePre: 'Цифры,',
  titleEmphasis: 'не обещания.',
  subtitle: 'С февраля 2026 года на рынке маркетинга Таджикистана.',
  projects: 'проектов',
  roas: 'средний ROAS',
  referral: 'по рекомендациям',
  niches: 'направлений',
};
const en: typeof ru = {
  eyebrow: 'Trust in numbers',
  titlePre: 'Numbers,',
  titleEmphasis: 'not promises.',
  subtitle: 'On the Tajikistan marketing market since February 2026.',
  projects: 'projects',
  roas: 'average ROAS',
  referral: 'by referral',
  niches: 'verticals',
};
const tg: typeof ru = {
  eyebrow: 'Эътимод дар рақамҳо',
  titlePre: 'Рақамҳо,',
  titleEmphasis: 'на ваъдаҳо.',
  subtitle: 'Аз феврали соли 2026 дар бозори маркетинги Тоҷикистон.',
  projects: 'лоиҳа',
  roas: 'ROAS-и миёна',
  referral: 'бо тавсия',
  niches: 'самтҳо',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export function TrustSection() {
  const t = useCopy(COPY);
  const stats = [
    { value: 15, suffix: '+', label: t.projects },
    { value: 4.8, decimals: 1, suffix: '×', label: t.roas },
    { value: 50, suffix: '%', label: t.referral },
    { value: 20, suffix: '+', label: t.niches },
  ];
  return (
    <section className="relative w-full px-6 py-section lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        {/* Header: eyebrow + headline + caption — one tight row, two columns on lg */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-eyebrow uppercase text-brand-orange">
                {t.eyebrow}
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 max-w-[14ch] font-display text-hero-sm font-extrabold text-light">
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
