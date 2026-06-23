'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '@/components/ui/Reveal';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

/**
 * Services — responsive interactive section.
 *
 *   Desktop (lg+):
 *     LEFT   sticky preview card — morphs on hover/focus of a service row.
 *     RIGHT  vertical service list with hover highlight.
 *
 *   Mobile (< lg):
 *     Single column. Each service row expands inline on tap — shows description
 *     and benefits inside the accordion. No sticky card.
 */

type VisualKind = 'target' | 'camera' | 'strategy' | 'brand' | 'funnel' | 'web' | 'sales';
type ServiceCopy = { title: string; sub: string; description: string; benefits: string[] };
type Service = ServiceCopy & { n: string; visual: VisualKind };

const SERVICE_META: { n: string; visual: VisualKind }[] = [
  { n: '01', visual: 'target' },
  { n: '02', visual: 'camera' },
  { n: '03', visual: 'strategy' },
  { n: '04', visual: 'brand' },
  { n: '05', visual: 'funnel' },
  { n: '06', visual: 'web' },
  { n: '07', visual: 'sales' },
];

const ru = {
  eyebrow: 'Услуги',
  titlePre: 'Полный',
  titleEmphasis: 'цикл.',
  subtitle: 'Семь направлений, одна система. Подбираем под цели бизнеса, масштаб и бюджет.',
  nicheLabel: 'направление',
  services: [
    { title: 'Таргетированная реклама', sub: 'Meta · Instagram · Facebook', description: 'Запускаем эффективную рекламу, которая окупает сама себя. Каждый сомони трафика работает на бизнес-модель, а не на CTR.', benefits: ['Сквозная аналитика', 'A/B тестирование креативов', 'Снижение CPL до 40%'] },
    { title: 'Контент-съёмка', sub: 'Reels · съёмка · монтаж', description: 'Премиальная продакшн-команда. Снимаем продающий контент, который работает на продажи и формирует образ бренда.', benefits: ['Сценарии под платформы', 'In-house продакшн', 'Контент направления на месяц для СММ'] },
    { title: 'Маркетинговая стратегия', sub: 'Система роста бизнеса', description: 'Глубокая диагностика, позиционирование и дорожная карта на 3–12 месяцев. Стратегия, как инструмент для продвижения, а не презентация.', benefits: ['Анализ ниши и конкурентов', 'Воронка под бизнес-модель', 'Классический и digital маркетинг'] },
    { title: 'Брендинг', sub: 'Позиционирование и визуал', description: 'Собираем айдентику, тон голоса и визуальные коды. Бренд, который выделяется и продаёт без лишних слов.', benefits: ['Logo & визуальная система', 'Brandbook + дизайн мерча', 'Tone of voice'] },
    { title: 'Воронки и автоматизация', sub: 'Воронки · лидогенерация', description: 'Строим лидген-машины: от первого касания до повторных продаж. Воронки, чат-боты, прогрев и сегментация — всё связано.', benefits: ['Построение воронки продаж', 'Чат-боты и автоворонки', 'Сегментация и реактивация'] },
    { title: 'Разработка сайтов', sub: 'Landing · premium websites', description: 'Сайты, которые конвертируют. От продающего лендинга до digital-флагмана бренда — с анимацией и быстрой загрузкой.', benefits: ['Next.js · современный стек', 'Score 95+ по Lighthouse', 'Анимация уровня премиум'] },
    { title: 'Мастер-классы по продажам', sub: 'Обучение отдела продаж', description: 'Прокачиваем отдел продаж: скрипты, работа с возражениями, дожим и контроль. Чтобы заявки от маркетинга превращались в деньги.', benefits: ['Скрипты и работа с возражениями', 'Разбор реальных звонков', 'Контроль и регламенты продаж'] },
  ] as ServiceCopy[],
  alacarte: {
    eyebrow: 'Отдельные услуги',
    pre: 'Заказать',
    emphasis: 'поштучно.',
    sub: 'Нужно что-то одно, без пакета? Берём отдельными задачами.',
    items: ['Создание сайтов', 'Создание брендбуков', 'Создание скриптов продаж', 'Дизайн: баннеры, визитки и др.', 'Мастер-классы по продажам'],
  },
};
const en: typeof ru = {
  eyebrow: 'Services',
  titlePre: 'Full',
  titleEmphasis: 'cycle.',
  subtitle: 'Seven directions, one system. Tailored to your goals, scale and budget.',
  nicheLabel: 'direction',
  services: [
    { title: 'Targeted advertising', sub: 'Meta · Instagram · Facebook', description: 'We launch effective advertising that pays for itself. Every somoni of traffic works for the business model, not for CTR.', benefits: ['End-to-end analytics', 'A/B creative testing', 'CPL reduced by up to 40%'] },
    { title: 'Content production', sub: 'Reels · shooting · editing', description: 'A premium production team. We shoot selling content that drives sales and builds the brand image.', benefits: ['Platform-specific scripts', 'In-house production', 'Monthly content plan for SMM'] },
    { title: 'Marketing strategy', sub: 'Business growth system', description: 'Deep diagnostics, positioning and a 3–12 month roadmap. Strategy as a tool for growth, not a presentation.', benefits: ['Niche & competitor analysis', 'Funnel for your business model', 'Classic & digital marketing'] },
    { title: 'Branding', sub: 'Positioning & visuals', description: 'We build the identity, tone of voice and visual codes. A brand that stands out and sells without extra words.', benefits: ['Logo & visual system', 'Brandbook + merch design', 'Tone of voice'] },
    { title: 'Funnels & automation', sub: 'Funnels · lead generation', description: 'We build lead-gen machines: from first touch to repeat sales. Funnels, chatbots, nurturing and segmentation — all connected.', benefits: ['Sales funnel build', 'Chatbots & auto-funnels', 'Segmentation & reactivation'] },
    { title: 'Web development', sub: 'Landing · premium websites', description: 'Websites that convert. From a selling landing page to a brand’s digital flagship — with animation and fast loading.', benefits: ['Next.js · modern stack', 'Lighthouse score 95+', 'Premium-level animation'] },
    { title: 'Sales workshops', sub: 'Sales team training', description: 'We level up your sales team: scripts, objection handling, closing and control. So marketing leads turn into money.', benefits: ['Scripts & objection handling', 'Real call reviews', 'Sales control & playbooks'] },
  ] as ServiceCopy[],
  alacarte: {
    eyebrow: 'À la carte',
    pre: 'Order',
    emphasis: 'piece by piece.',
    sub: 'Need just one thing, without a package? We take it as a standalone task.',
    items: ['Website creation', 'Brandbook creation', 'Sales script creation', 'Design: banners, cards, etc.', 'Sales workshops'],
  },
};
const tg: typeof ru = {
  eyebrow: 'Хидматҳо',
  titlePre: 'Сикли',
  titleEmphasis: 'пурра.',
  subtitle: 'Ҳафт самт, як система. Мувофиқи ҳадаф, миқёс ва буҷети бизнес интихоб мекунем.',
  nicheLabel: 'самт',
  services: [
    { title: 'Рекламаи мақсаднок', sub: 'Meta · Instagram · Facebook', description: 'Рекламаи самаранокеро роҳандозӣ мекунем, ки худро мепӯшонад. Ҳар сомонии трафик ба модели бизнес кор мекунад, на ба CTR.', benefits: ['Таҳлили пурра', 'Тестбандии A/B-и креативҳо', 'Кам кардани CPL то 40%'] },
    { title: 'Гирифтани контент', sub: 'Reels · наворбардорӣ · монтаж', description: 'Дастаи продакшни сатҳи баланд. Контенти фурӯшгареро наворбардорӣ мекунем, ки фурӯшро зиёд карда, симои брендро месозад.', benefits: ['Сенарияҳо барои платформаҳо', 'Продакшни дохилӣ', 'Нақшаи контент барои СММ дар як моҳ'] },
    { title: 'Стратегияи маркетингӣ', sub: 'Системаи рушди бизнес', description: 'Ташхиси амиқ, мавқеъгузорӣ ва нақшаи роҳ барои 3–12 моҳ. Стратегия ҳамчун воситаи пешбарӣ, на презентатсия.', benefits: ['Таҳлили ниша ва рақибон', 'Воронка барои модели бизнес', 'Маркетинги классикӣ ва рақамӣ'] },
    { title: 'Брендинг', sub: 'Мавқеъгузорӣ ва визуал', description: 'Айдентика, оҳанги овоз ва кодҳои визуалиро месозем. Бренде, ки фарқ мекунад ва бе суханони зиёдатӣ мефурӯшад.', benefits: ['Лого ва системаи визуалӣ', 'Брендбук + дизайни мерч', 'Оҳанги овоз'] },
    { title: 'Воронкаҳо ва автоматизатсия', sub: 'Воронкаҳо · лидгенератсия', description: 'Мошинҳои лидгенро месозем: аз тамоси аввал то фурӯшҳои такрорӣ. Воронкаҳо, чат-ботҳо, гармкунӣ ва сегментатсия — ҳама пайваст.', benefits: ['Сохтани воронкаи фурӯш', 'Чат-ботҳо ва автоворонкаҳо', 'Сегментатсия ва реактиватсия'] },
    { title: 'Сохтани сайтҳо', sub: 'Landing · premium websites', description: 'Сайтҳое, ки конверсия медиҳанд. Аз лендинги фурӯшгар то парчами рақамии бренд — бо анимация ва боркунии тез.', benefits: ['Next.js · стеки муосир', 'Score 95+ дар Lighthouse', 'Анимацияи сатҳи премиум'] },
    { title: 'Мастер-классҳои фурӯш', sub: 'Омӯзиши шуъбаи фурӯш', description: 'Шуъбаи фурӯшро тақвият медиҳем: скриптҳо, кор бо эътирозҳо, ниҳоӣ ва назорат. То заявкаҳои маркетинг ба пул табдил ёбанд.', benefits: ['Скриптҳо ва кор бо эътирозҳо', 'Таҳлили зангҳои воқеӣ', 'Назорат ва регламенти фурӯш'] },
  ] as ServiceCopy[],
  alacarte: {
    eyebrow: 'Хидматҳои алоҳида',
    pre: 'Фармоиш',
    emphasis: 'донагӣ.',
    sub: 'Танҳо як чиз лозим аст, бе баста? Ҳамчун вазифаи алоҳида қабул мекунем.',
    items: ['Сохтани сайтҳо', 'Сохтани брендбукҳо', 'Сохтани скриптҳои фурӯш', 'Дизайн: баннерҳо, визиткаҳо ва ғ.', 'Мастер-классҳои фурӯш'],
  },
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

/* ─── abstract visual per service ─── */
function Visual({ kind }: { kind: Service['visual'] }) {
  switch (kind) {
    case 'target':
      return (
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(212,236,76,0.18)" strokeWidth="0.8" strokeDasharray="2 6" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="rgba(212,236,76,0.3)" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="38" fill="none" stroke="rgba(252,150,3,0.5)" strokeWidth="1" />
          <circle cx="100" cy="100" r="14" fill="none" stroke="#D4EC4C" strokeWidth="1.4" />
          <circle cx="100" cy="100" r="3" fill="#D4EC4C" />
          <path d="M 100 100 L 168 56" stroke="#FC9603" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="168" cy="56" r="3" fill="#FC9603" />
        </svg>
      );
    case 'camera':
      return (
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <rect x="44" y="68" width="112" height="72" rx="8" fill="none" stroke="rgba(212,236,76,0.4)" strokeWidth="1.2" />
          <circle cx="100" cy="104" r="22" fill="none" stroke="#D4EC4C" strokeWidth="1.4" />
          <circle cx="100" cy="104" r="12" fill="none" stroke="rgba(212,236,76,0.5)" strokeWidth="1" />
          <circle cx="100" cy="104" r="3" fill="#FC9603" />
          <rect x="74" y="56" width="34" height="14" rx="3" fill="none" stroke="rgba(212,236,76,0.3)" strokeWidth="0.8" />
          <circle cx="140" cy="80" r="2" fill="#FC9603" />
        </svg>
      );
    case 'strategy':
      return (
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <path d="M 20 160 L 60 130 L 100 140 L 140 90 L 180 50" stroke="#D4EC4C" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="60" cy="130" r="3" fill="#D4EC4C" />
          <circle cx="100" cy="140" r="3" fill="#D4EC4C" />
          <circle cx="140" cy="90" r="3" fill="#FC9603" />
          <circle cx="180" cy="50" r="4" fill="#D4EC4C" />
          <line x1="20" y1="40" x2="20" y2="170" stroke="rgba(245,241,250,0.12)" strokeWidth="0.6" />
          <line x1="20" y1="170" x2="190" y2="170" stroke="rgba(245,241,250,0.12)" strokeWidth="0.6" />
          <text x="180" y="40" fill="#D4EC4C" fontSize="11" fontFamily="monospace" textAnchor="end">+312%</text>
        </svg>
      );
    case 'brand':
      return (
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(212,236,76,0.2)" strokeWidth="0.6" />
          <text x="100" y="116" fill="#D4EC4C" fontSize="64" fontWeight="800" fontFamily="serif" fontStyle="italic" textAnchor="middle">M</text>
          <circle cx="138" cy="62" r="3" fill="#FC9603" />
          <line x1="40" y1="172" x2="160" y2="172" stroke="rgba(212,236,76,0.4)" strokeWidth="0.8" />
          <text x="100" y="186" fill="rgba(245,241,250,0.5)" fontSize="7" letterSpacing="4" fontFamily="monospace" textAnchor="middle">BRAND SYSTEM</text>
        </svg>
      );
    case 'funnel':
      return (
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <path d="M 30 50 L 170 50 L 130 110 L 130 160 L 70 160 L 70 110 Z" fill="none" stroke="rgba(212,236,76,0.4)" strokeWidth="1.2" />
          <line x1="30" y1="75" x2="170" y2="75" stroke="rgba(212,236,76,0.2)" strokeWidth="0.6" strokeDasharray="3 4" />
          <line x1="50" y1="95" x2="150" y2="95" stroke="rgba(212,236,76,0.25)" strokeWidth="0.6" strokeDasharray="3 4" />
          <circle cx="100" cy="160" r="6" fill="#FC9603" />
          <circle cx="100" cy="160" r="11" fill="none" stroke="#FC9603" strokeWidth="0.8" opacity="0.5" />
        </svg>
      );
    case 'web':
      return (
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <rect x="34" y="46" width="132" height="108" rx="6" fill="none" stroke="rgba(212,236,76,0.4)" strokeWidth="1.2" />
          <line x1="34" y1="64" x2="166" y2="64" stroke="rgba(212,236,76,0.25)" strokeWidth="0.6" />
          <circle cx="44" cy="55" r="1.6" fill="rgba(252,150,3,0.7)" />
          <circle cx="50" cy="55" r="1.6" fill="rgba(212,236,76,0.4)" />
          <circle cx="56" cy="55" r="1.6" fill="rgba(245,241,250,0.2)" />
          <rect x="46" y="76" width="50" height="40" rx="3" fill="rgba(212,236,76,0.08)" stroke="rgba(212,236,76,0.3)" strokeWidth="0.6" />
          <rect x="104" y="76" width="56" height="8" rx="2" fill="rgba(212,236,76,0.5)" />
          <rect x="104" y="90" width="40" height="6" rx="2" fill="rgba(245,241,250,0.2)" />
          <rect x="104" y="102" width="48" height="6" rx="2" fill="rgba(245,241,250,0.15)" />
          <rect x="46" y="124" width="114" height="20" rx="3" fill="none" stroke="rgba(212,236,76,0.25)" strokeWidth="0.6" />
        </svg>
      );
    case 'sales':
      return (
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <rect x="40" y="40" width="120" height="80" rx="6" fill="none" stroke="rgba(212,236,76,0.4)" strokeWidth="1.2" />
          <path d="M 58 102 L 86 78 L 108 90 L 140 58" stroke="#D4EC4C" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 130 58 L 142 58 L 142 70" stroke="#FC9603" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="100" y1="120" x2="100" y2="136" stroke="rgba(212,236,76,0.4)" strokeWidth="1.2" />
          <line x1="74" y1="136" x2="126" y2="136" stroke="rgba(212,236,76,0.4)" strokeWidth="1.2" />
          <circle cx="64" cy="158" r="6" fill="none" stroke="rgba(212,236,76,0.45)" strokeWidth="1" />
          <circle cx="100" cy="164" r="6" fill="none" stroke="rgba(212,236,76,0.45)" strokeWidth="1" />
          <circle cx="136" cy="158" r="6" fill="none" stroke="rgba(252,150,3,0.5)" strokeWidth="1" />
        </svg>
      );
  }
}

export function ServicesSection() {
  const t = useCopy(COPY);
  const [active, setActive] = useState(0);
  const [mobileOpen, setMobileOpen] = useState<number | null>(null);
  const SERVICES: Service[] = SERVICE_META.map((m, i) => ({ ...m, ...t.services[i] }));
  const current = SERVICES[active];

  return (
    <section id="services" className="relative w-full px-6 py-section lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        {/* Section header */}
        <div className="mb-14 grid grid-cols-1 gap-8 lg:mb-20 lg:grid-cols-[1fr_2fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-eyebrow uppercase text-brand-orange">{t.eyebrow}</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-5 max-w-[12ch] font-display text-hero-sm font-extrabold text-light">
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

        {/* ─── DESKTOP: sticky card + hover list (lg+) ─── */}
        <div className="hidden lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* LEFT: STICKY PREVIEW CARD */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-10">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-lime/[0.08] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-brand-purple/[0.18] blur-3xl" />

              <div className="relative flex items-center justify-between">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`n-${current.n}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="font-mono text-[11px] uppercase tracking-[0.32em] text-brand-orange"
                  >
                    {current.n} / 07
                  </motion.span>
                </AnimatePresence>
                <span className="text-[10px] uppercase tracking-[0.28em] text-light/35">{t.nicheLabel}</span>
              </div>

              <div className="relative mt-8 aspect-[5/3] w-full overflow-hidden rounded-2xl border border-white/[0.05] bg-ink/40">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`v-${current.n}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex items-center justify-center p-6"
                  >
                    <Visual kind={current.visual} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative mt-8 min-h-[200px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`t-${current.n}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h3 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-light md:text-4xl">
                      {current.title}
                    </h3>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-brand-lime/80">{current.sub}</p>
                    <p className="mt-6 text-[15px] leading-[1.7] text-light/65">{current.description}</p>
                    <ul className="mt-8 space-y-3">
                      {current.benefits.map((b) => (
                        <li key={b} className="flex items-center gap-3 text-sm text-light/75">
                          <span className="flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-lime shadow-[0_0_10px_rgba(212,236,76,0.6)]" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* RIGHT: SERVICES LIST */}
          <ul className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
            {SERVICES.map((s, i) => {
              const isActive = active === i;
              return (
                <Reveal key={s.n} delay={0.04 + i * 0.03}>
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
                      className="grid grid-cols-[36px_1fr_auto] items-baseline gap-5 py-8"
                    >
                      <span className={`font-mono text-[11px] tracking-[0.2em] transition-colors duration-300 ${isActive ? 'text-brand-lime' : 'text-brand-orange/70'}`}>
                        {s.n}
                      </span>
                      <div className="min-w-0">
                        <h3 className={`font-display text-xl font-extrabold leading-tight tracking-tight transition-colors duration-300 md:text-2xl lg:text-[1.7rem] ${isActive ? 'text-light' : 'text-light/55'}`}>
                          {s.title}
                        </h3>
                        <p className={`mt-1.5 text-[10px] uppercase tracking-[0.22em] transition-colors duration-300 ${isActive ? 'text-light/55' : 'text-light/30'}`}>
                          {s.sub}
                        </p>
                      </div>
                      <span className={`transition-all duration-500 ${isActive ? 'translate-x-1 text-brand-lime' : 'text-light/25 group-hover:text-light/50'}`}>
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
        <ul className="divide-y divide-white/[0.05] border-y border-white/[0.05] lg:hidden">
          {SERVICES.map((s, i) => {
            const isOpen = mobileOpen === i;
            return (
              <Reveal key={s.n} delay={0.04 + i * 0.03}>
                <li className="relative">
                  <button
                    onClick={() => setMobileOpen(isOpen ? null : i)}
                    className="flex w-full items-start gap-4 py-6 text-left"
                  >
                    <span className={`mt-1 font-mono text-[11px] tracking-[0.2em] transition-colors duration-300 ${isOpen ? 'text-brand-lime' : 'text-brand-orange/70'}`}>
                      {s.n}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-display text-lg font-extrabold leading-tight tracking-tight transition-colors duration-300 ${isOpen ? 'text-light' : 'text-light/60'}`}>
                        {s.title}
                      </h3>
                      <p className={`mt-1 text-[10px] uppercase tracking-[0.22em] transition-colors duration-300 ${isOpen ? 'text-light/50' : 'text-light/30'}`}>
                        {s.sub}
                      </p>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 14 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="text-sm leading-relaxed text-light/60">{s.description}</p>
                            <ul className="mt-4 space-y-2.5">
                              {s.benefits.map((b) => (
                                <li key={b} className="flex items-center gap-2.5 text-[13px] text-light/70">
                                  <span className="flex h-1 w-1 flex-shrink-0 rounded-full bg-brand-lime shadow-[0_0_8px_rgba(212,236,76,0.5)]" />
                                  {b}
                                </li>
                              ))}
                            </ul>
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
                </li>
              </Reveal>
            );
          })}
        </ul>

        {/* ─── Отдельные услуги (à la carte) ─── */}
        <Reveal delay={0.1}>
          <div className="mt-16 overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-8 lg:mt-20 lg:p-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-eyebrow uppercase text-brand-orange">{t.alacarte.eyebrow}</p>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-light lg:text-3xl">
                  {t.alacarte.pre}{' '}
                  <span className="font-serif italic font-normal text-lime-grad">{t.alacarte.emphasis}</span>
                </h3>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-light/55 lg:text-right">
                {t.alacarte.sub}
              </p>
            </div>
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {t.alacarte.items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-ink/40 px-5 py-4 text-sm text-light/80 transition-colors hover:border-brand-lime/40 hover:text-light"
                >
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-lime shadow-[0_0_10px_rgba(212,236,76,0.6)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
