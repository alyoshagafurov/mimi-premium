'use client';

import { Reveal } from '@/components/ui/Reveal';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

/**
 * Guarantees — reassurance strip before the final CTA.
 * Plain rules of engagement, no over-promises.
 */
type GuaranteeCopy = { title: string; desc: string };
const N = ['01', '02', '03'];

const ru = {
  eyebrow: 'Гарантии',
  titlePre: 'Спокойствие',
  titleEmphasis: 'в цифрах.',
  subtitle: 'Никакой магии и пустых обещаний. Только понятные правила работы.',
  items: [
    { title: 'Отчёты каждый месяц', desc: 'Каждый месяц получаете понятные отчёты: что сделали, куда ушёл бюджет и какой результат.' },
    { title: 'Прозрачные KPI', desc: 'Договариваемся о метриках на старте. Вы всегда видите цифры и движение к цели.' },
    { title: 'Аудит без обязательств', desc: 'Покажем точки роста в вашей нише за 48 часов. Без продающих звонков и давления.' },
  ] as GuaranteeCopy[],
};
const en: typeof ru = {
  eyebrow: 'Guarantees',
  titlePre: 'Peace of mind',
  titleEmphasis: 'in numbers.',
  subtitle: 'No magic and no empty promises. Just clear rules of engagement.',
  items: [
    { title: 'Reports every month', desc: 'Every month you get clear reports: what we did, where the budget went and what the result was.' },
    { title: 'Transparent KPIs', desc: 'We agree on metrics up front. You always see the numbers and the progress toward the goal.' },
    { title: 'Audit with no obligations', desc: 'We’ll show the growth points in your niche within 48 hours. No sales calls, no pressure.' },
  ] as GuaranteeCopy[],
};
const tg: typeof ru = {
  eyebrow: 'Кафолатҳо',
  titlePre: 'Оромӣ',
  titleEmphasis: 'дар рақамҳо.',
  subtitle: 'Ҳеҷ ҷодугарӣ ва ваъдаҳои холӣ нест. Танҳо қоидаҳои фаҳмои кор.',
  items: [
    { title: 'Ҳисобот ҳар моҳ', desc: 'Ҳар моҳ ҳисоботи фаҳмо мегиред: чӣ кор кардем, буҷет ба куҷо рафт ва натиҷа чӣ буд.' },
    { title: 'KPI-и шаффоф', desc: 'Дар оғоз дар бораи метрикаҳо мувофиқа мекунем. Шумо ҳамеша рақамҳо ва ҳаракат ба ҳадафро мебинед.' },
    { title: 'Аудити бе уҳдадорӣ', desc: 'Нуқтаҳои рушди нишаи шуморо дар 48 соат нишон медиҳем. Бе зангҳои фурӯшгар ва фишор.' },
  ] as GuaranteeCopy[],
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export function GuaranteesSection() {
  const t = useCopy(COPY);
  const guarantees = t.items.map((g, i) => ({ ...g, n: N[i] }));
  return (
    <section className="relative w-full px-6 py-section lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-eyebrow uppercase text-brand-orange">{t.eyebrow}</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 max-w-[16ch] font-display text-hero-sm font-extrabold text-light">
                {t.titlePre}{' '}
                <span className="font-serif italic font-normal text-lime-grad">{t.titleEmphasis}</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <p className="max-w-md text-base leading-relaxed text-light/55 lg:text-right">
              {t.subtitle}
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-white/[0.05] md:grid-cols-3">
          {guarantees.map((g, i) => (
            <Reveal key={g.n} delay={0.06 + i * 0.08}>
              <div className="flex h-full flex-col gap-4 bg-ink p-10 lg:p-12">
                <span className="font-display text-xs font-medium text-brand-orange">{g.n}</span>
                <h3 className="font-display text-xl font-extrabold leading-tight text-light lg:text-2xl">
                  {g.title}
                </h3>
                <p className="text-sm leading-relaxed text-light/55">{g.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
