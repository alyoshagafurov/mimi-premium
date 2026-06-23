'use client';

import { Reveal } from '@/components/ui/Reveal';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ContactForm } from './ContactForm';

export function FinalCTA() {
  return (
    <section id="cta" className="relative w-full overflow-hidden px-6 py-section lg:px-12">
      {/* Soft cinematic vignette */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[80%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purpleLight/12 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-[1500px] grid-cols-1 gap-16 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <Reveal>
            <p className="text-eyebrow uppercase text-brand-orange">Финал</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-8 max-w-[16ch] font-display text-hero font-extrabold leading-[1] text-light">
              Готовы к&nbsp;
              <span className="font-serif italic font-normal text-lime-grad">
                системному
              </span>{' '}
              росту?
            </h2>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-8 max-w-md text-base leading-relaxed text-light/60">
              Покажем точки роста в вашей нише за 48 часов. Без обязательств и
              продающих звонков.
            </p>
          </Reveal>
          <Reveal delay={0.28} className="mt-10 flex flex-wrap items-center gap-5">
            <MagneticButton href="#cta-form" variant="lime" arrow>
              Получить аудит
            </MagneticButton>
            <a
              href="https://instagram.com/mimi.agency.tj"
              className="font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-light/65 transition-colors hover:text-brand-lime"
            >
              Instagram →
            </a>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div id="cta-form">
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
