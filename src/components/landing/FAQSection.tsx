'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '@/components/ui/Reveal';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

/**
 * FAQ — responsive interactive section.
 *
 *   Desktop (lg+):
 *     LEFT   sticky answer panel — morphs on hover/focus/click of a question.
 *     RIGHT  question list with hover highlight.
 *
 *   Mobile (< lg):
 *     Single column accordion — tap a question to expand the answer inline.
 */

type Item = { n: string; q: string; a: string; tag: string };
type ItemCopy = { q: string; a: string; tag: string };

const ru = {
  titlePre: 'Частые',
  titleEmphasis: 'вопросы.',
  subtitle: 'Если остался вопрос — напишите нам, ответим лично.',
  answerLabel: 'ответ',
  stillQuestion: 'остался вопрос?',
  whatsapp: 'написать в WhatsApp →',
  items: [
    { q: 'Сколько занимает запуск?', a: '7–14 дней в зависимости от тарифа и готовности материалов. PRO — быстрее, ELITE — полная стратегия и брендинг до старта. Точный план даём на брифе.', tag: 'Сроки' },
    { q: 'Какие гарантии вы даёте?', a: 'Мы не обещаем «лиды в первый день». Обещаем прозрачность: вы видите все цифры в личном кабинете. И остаётесь постоянно на связи с маркетинговой командой.', tag: 'Гарантии' },
    { q: 'Можно начать с одного направления?', a: 'Да. PRO включает только таргет + аналитику. STANDART и ELITE — система, где работают все каналы вместе и усиливают друг друга.', tag: 'Форматы' },
    { q: 'Кому вы НЕ подходите?', a: 'Тем, кто хочет «магический рост» без перестройки воронки и контента. Мы строим систему — это требует включённости с обеих сторон и горизонта 3+ месяца.', tag: 'Ожидания' },
    { q: 'Что внутри личного кабинета?', a: 'Дашборд с KPI, ROMI, воронкой, лидами и активными кампаниями. Обновляется по мере поступления метрик. Доступ — после оплаты тарифа.', tag: 'Продукт' },
  ] as ItemCopy[],
};
const en: typeof ru = {
  titlePre: 'Frequent',
  titleEmphasis: 'questions.',
  subtitle: 'Still have a question? Write to us and we’ll answer personally.',
  answerLabel: 'answer',
  stillQuestion: 'still have a question?',
  whatsapp: 'message on WhatsApp →',
  items: [
    { q: 'How long does launch take?', a: '7–14 days depending on the plan and readiness of materials. PRO — faster, ELITE — full strategy and branding before launch. We give an exact plan at the brief.', tag: 'Timing' },
    { q: 'What guarantees do you give?', a: 'We don’t promise «leads on day one». We promise transparency: you see all the numbers in your dashboard — and stay in constant touch with the marketing team.', tag: 'Guarantees' },
    { q: 'Can we start with one direction?', a: 'Yes. PRO includes only targeting + analytics. STANDART and ELITE — a system where all channels work together and reinforce each other.', tag: 'Formats' },
    { q: 'Who are you NOT a fit for?', a: 'Those who want «magic growth» without rebuilding the funnel and content. We build a system — that requires involvement from both sides and a 3+ month horizon.', tag: 'Expectations' },
    { q: 'What’s inside the dashboard?', a: 'A dashboard with KPIs, ROMI, funnel, leads and active campaigns. Updated as metrics come in. Access — after paying for a plan.', tag: 'Product' },
  ] as ItemCopy[],
};
const tg: typeof ru = {
  titlePre: 'Саволҳои',
  titleEmphasis: 'зуд-зуд.',
  subtitle: 'Агар саволе монд — ба мо нависед, шахсан ҷавоб медиҳем.',
  answerLabel: 'ҷавоб',
  stillQuestion: 'саволе монд?',
  whatsapp: 'навиштан дар WhatsApp →',
  items: [
    { q: 'Оғоз чӣ қадар вақт мегирад?', a: '7–14 рӯз вобаста ба тариф ва омодагии маводҳо. PRO — тезтар, ELITE — стратегияи пурра ва брендинг то оғоз. Нақшаи дақиқро дар бриф медиҳем.', tag: 'Мӯҳлат' },
    { q: 'Шумо чӣ кафолат медиҳед?', a: 'Мо «лид дар рӯзи аввал»-ро ваъда намедиҳем. Шаффофиятро ваъда медиҳем: шумо ҳамаи рақамҳоро дар кабинети шахсӣ мебинед. Ва доимо бо дастаи маркетинг дар алоқа мемонед.', tag: 'Кафолат' },
    { q: 'Бо як самт оғоз кардан мумкин аст?', a: 'Бале. PRO танҳо таргет + аналитикаро дар бар мегирад. STANDART ва ELITE — система, ки дар он ҳамаи каналҳо якҷоя кор карда, ҳамдигарро тақвият медиҳанд.', tag: 'Форматҳо' },
    { q: 'Шумо ба КӢ мувофиқ НЕСТЕД?', a: 'Ба онҳое, ки «рушди ҷодугарона»-ро бе аз нав сохтани воронка ва контент мехоҳанд. Мо системаро месозем — ин иштироки ҳарду тараф ва уфуқи 3+ моҳро талаб мекунад.', tag: 'Интизориҳо' },
    { q: 'Дар дохили кабинети шахсӣ чӣ ҳаст?', a: 'Дашборд бо KPI, ROMI, воронка, лидҳо ва маъракаҳои фаъол. Бо воридшавии метрикаҳо нав мешавад. Дастрасӣ — пас аз пардохти тариф.', tag: 'Маҳсулот' },
  ] as ItemCopy[],
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export function FAQSection({ cmsFaqs }: { cmsFaqs?: { question: string; answer: string }[] } = {}) {
  const t = useCopy(COPY);
  // Prefer FAQ managed in the CMS; fall back to the built-in copy when none published.
  const source: ItemCopy[] = cmsFaqs && cmsFaqs.length
    ? cmsFaqs.map((f) => ({ q: f.question, a: f.answer, tag: 'FAQ' }))
    : t.items;
  const ITEMS: Item[] = source.map((it, i) => ({ ...it, n: String(i + 1).padStart(2, '0') }));
  const total = String(ITEMS.length).padStart(2, '0');
  const [active, setActive] = useState(0);
  const [mobileOpen, setMobileOpen] = useState<number | null>(0);
  const current = ITEMS[active] ?? ITEMS[0];

  return (
    <section id="faq" className="relative w-full px-6 py-section lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-14 grid grid-cols-1 gap-8 lg:mb-20 lg:grid-cols-[1fr_2fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-eyebrow uppercase text-brand-orange">FAQ</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-5 max-w-[12ch] font-display text-hero-sm font-extrabold">
                {t.titlePre}{' '}
                <span className="font-serif italic font-normal text-lime-grad">{t.titleEmphasis}</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <p className="max-w-md text-base leading-relaxed text-light/55 lg:text-right">
              {t.subtitle}
            </p>
          </Reveal>
        </div>

        {/* ─── DESKTOP: sticky answer panel + hover list (lg+) ─── */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* LEFT: STICKY ANSWER PANEL */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-10">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-lime/[0.07] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-brand-purple/[0.2] blur-3xl" />

              <div className="relative flex items-center justify-between">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`tag-${current.n}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="font-mono text-[11px] uppercase tracking-[0.32em] text-brand-orange"
                  >
                    {current.n} / {total} · {current.tag}
                  </motion.span>
                </AnimatePresence>
                <span className="text-[10px] uppercase tracking-[0.28em] text-light/35">{t.answerLabel}</span>
              </div>

              <div className="relative mt-8 min-h-[280px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`a-${current.n}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-light md:text-3xl">
                      {current.q}
                    </h3>
                    <div className="mt-6 h-px w-12 bg-brand-lime/60" />
                    <p className="mt-6 text-[15px] leading-[1.75] text-light/65">{current.a}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative mt-10 flex items-center justify-between border-t border-white/[0.06] pt-6">
                <span className="text-[10px] uppercase tracking-[0.28em] text-light/35">{t.stillQuestion}</span>
                <a
                  href="https://wa.me/992070217755"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] uppercase tracking-[0.24em] text-brand-lime transition-colors hover:text-brand-limeSoft"
                >
                  {t.whatsapp}
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: QUESTION LIST */}
          <ul className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
            {ITEMS.map((it, i) => {
              const isActive = active === i;
              return (
                <Reveal key={it.n} delay={0.04 + i * 0.03}>
                  <li
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    tabIndex={0}
                    className="group relative cursor-pointer outline-none"
                  >
                    <motion.div
                      animate={{ x: isActive ? 10 : 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="grid grid-cols-[36px_1fr_auto] items-center gap-5 py-8"
                    >
                      <span className={`font-mono text-[11px] tracking-[0.2em] transition-colors duration-300 ${isActive ? 'text-brand-lime' : 'text-brand-orange/70'}`}>
                        {it.n}
                      </span>
                      <h3 className={`font-display text-lg font-extrabold leading-tight tracking-tight transition-colors duration-300 md:text-xl lg:text-[1.4rem] ${isActive ? 'text-light' : 'text-light/55'}`}>
                        {it.q}
                      </h3>
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-base transition-all duration-500 ${isActive ? 'border-brand-lime/60 text-brand-lime' : 'border-white/15 text-light/40'}`}>
                        →
                      </span>
                    </motion.div>
                    <motion.span
                      initial={false}
                      animate={{ scaleX: isActive ? 1 : 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-x-0 -bottom-px h-px origin-left bg-gradient-to-r from-brand-lime via-brand-lime/40 to-transparent"
                    />
                  </li>
                </Reveal>
              );
            })}
          </ul>
        </div>

        {/* ─── MOBILE: inline accordion (< lg) ─── */}
        <div className="divide-y divide-white/[0.05] border-y border-white/[0.05] lg:hidden">
          {ITEMS.map((it, i) => {
            const isOpen = mobileOpen === i;
            return (
              <Reveal key={it.n} delay={0.04 + i * 0.03}>
                <button
                  onClick={() => setMobileOpen(isOpen ? null : i)}
                  className="flex w-full items-start gap-4 py-6 text-left"
                >
                  <span className={`mt-1 font-mono text-[11px] tracking-[0.2em] transition-colors duration-300 ${isOpen ? 'text-brand-lime' : 'text-brand-orange/70'}`}>
                    {it.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-display text-lg font-extrabold leading-tight tracking-tight transition-colors duration-300 ${isOpen ? 'text-light' : 'text-light/60'}`}>
                      {it.q}
                    </h3>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginTop: 14 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-sm text-sm leading-relaxed text-light/60">{it.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-sm transition-all duration-500 mt-0.5 ${
                      isOpen ? 'rotate-45 border-brand-lime/60 text-brand-lime' : 'border-white/15 text-light/40'
                    }`}
                  >
                    +
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
