'use client';

import { Reveal } from '@/components/ui/Reveal';

/**
 * Guarantees — reassurance strip before the final CTA.
 * Plain rules of engagement, no over-promises.
 */
const guarantees = [
  {
    n: '01',
    title: 'Отчёты каждый месяц',
    desc: 'Каждый месяц получаете понятные отчёты: что сделали, куда ушёл бюджет и какой результат.',
  },
  {
    n: '02',
    title: 'Прозрачные KPI',
    desc: 'Договариваемся о метриках на старте. Вы всегда видите цифры и движение к цели.',
  },
  {
    n: '03',
    title: 'Аудит без обязательств',
    desc: 'Покажем точки роста в вашей нише за 48 часов. Без продающих звонков и давления.',
  },
];

export function GuaranteesSection() {
  return (
    <section className="relative w-full px-6 py-section lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-eyebrow uppercase text-brand-orange">Гарантии</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 max-w-[16ch] font-display text-hero-sm font-extrabold text-light">
                Спокойствие{' '}
                <span className="font-serif italic font-normal text-lime-grad">в&nbsp;цифрах.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <p className="max-w-md text-base leading-relaxed text-light/55 lg:text-right">
              Никакой магии и пустых обещаний. Только понятные правила работы.
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
