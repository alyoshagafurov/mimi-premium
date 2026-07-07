'use client';

import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { TopNav } from '@/components/ui/TopNav';
import { Logo } from '@/components/ui/Logo';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';

const BRAND_PHONE = process.env.NEXT_PUBLIC_BRAND_PHONE ?? '+992 07 021 77 55';
const BRAND_INSTAGRAM = process.env.NEXT_PUBLIC_BRAND_INSTAGRAM ?? 'https://instagram.com/mimi.agency.tj';
const BRAND_INSTAGRAM_HANDLE = 'mimi.agency.tj';
const BRAND_WEB = process.env.NEXT_PUBLIC_BRAND_WEB ?? 'mimitj.agency';
const BRAND_EMAIL = process.env.NEXT_PUBLIC_BRAND_EMAIL ?? 'hello@mimi.agency.tj';

type ValueCopy = { title: string; body: string; wide?: boolean };

const ru = {
  chip: 'Контакты',
  heading: 'Бренд-визитка',
  subtitle: 'Сохраните или распечатайте — мы всегда на связи.',
  motto: 'Минимум затрат — максимум узнаваемости',
  whatsapp: 'Написать в WhatsApp',
  services: ['Маркетинг', 'Брендинг', 'Таргетинг', 'Дизайн', 'Стратегия'],
  print: 'Распечатать',
  openInsta: 'Открыть Instagram',
  valuesTitle: 'наши ценности',
  values: [
    { title: 'Умная эффективность', body: 'Каждое решение — на смысле, стратегии и реальной пользе бренда.' },
    { title: 'Смелость мышления', body: 'Думаем шире, действуем точнее, берём ответственность за результат.' },
    { title: 'Премиальное отношение', body: 'Внимание к деталям и качество — наш стандарт, а не опция.' },
    { title: 'Результат как репутация', body: 'Наше имя строится не на словах, а на кейсах.' },
    { title: 'Партнёрство', body: 'Мы не подрядчик. Мы часть вашей команды.', wide: true },
  ] as ValueCopy[],
  valuesCta: 'меньше шума, больше смысла и ответственности.',
};
const en: typeof ru = {
  chip: 'Contacts',
  heading: 'Brand card',
  subtitle: 'Save or print — we are always in touch.',
  motto: 'Minimum costs — maximum recognition',
  whatsapp: 'Message on WhatsApp',
  services: ['Marketing', 'Branding', 'Targeting', 'Design', 'Strategy'],
  print: 'Print',
  openInsta: 'Open Instagram',
  valuesTitle: 'our values',
  values: [
    { title: 'Smart efficiency', body: 'Every decision is based on meaning, strategy and real brand value.' },
    { title: 'Bold thinking', body: 'Think bigger, act sharper, take responsibility for results.' },
    { title: 'Premium attitude', body: 'Attention to detail and quality is our standard, not an option.' },
    { title: 'Results as reputation', body: 'Our name is built on cases, not words.' },
    { title: 'Partnership', body: 'We are not a contractor. We are part of your team.', wide: true },
  ] as ValueCopy[],
  valuesCta: 'less noise, more meaning and responsibility.',
};
const tg: typeof ru = {
  chip: 'Тамосҳо',
  heading: 'Корти бренд',
  subtitle: 'Нигоҳ доред ё чоп кунед — мо ҳамеша дар алоқаем.',
  motto: 'Ҳадди ақали хароҷот — ҳадди аксари шинохт',
  whatsapp: 'Навиштан дар WhatsApp',
  services: ['Маркетинг', 'Брендинг', 'Таргетинг', 'Дизайн', 'Стратегия'],
  print: 'Чоп кардан',
  openInsta: 'Кушодани Instagram',
  valuesTitle: 'арзишҳои мо',
  values: [
    { title: 'Самаранокии зиракона', body: 'Ҳар як қарор бар асоси маъно, стратегия ва фоидаи воқеии бренд аст.' },
    { title: 'Ҷасорати тафаккур', body: 'Васеътар фикр мекунем, дақиқтар амал мекунем, масъулиятро мегирем.' },
    { title: 'Муносибати премиалӣ', body: 'Диққат ба ҷузъиёт ва сифат — стандарти мо аст, на опсия.' },
    { title: 'Натиҷа ҳамчун обрӯ', body: 'Номи мо на бо суханон, балки бо кейсҳо сохта мешавад.' },
    { title: 'Шарикӣ', body: 'Мо пудратчӣ нестем. Мо қисми дастаи шумоем.', wide: true },
  ] as ValueCopy[],
  valuesCta: 'камтар садо, бештар маъно ва масъулият.',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export default function ContactsPage() {
  const t = useCopy(COPY);
  const N = ['01', '02', '03', '04', '05'];
  return (
    <div className="relative min-h-screen">
      <TopNav />
      <div className="no-print pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-brand-purple/15 blur-3xl" />
      </div>
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 pb-20 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-10 text-center"
        >
          <span className="chip text-brand-lime/80">{t.chip}</span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            {t.heading} <span className="text-lime-grad">mimi.</span>
          </h1>
          <p className="mt-3 text-sm text-muted">{t.subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl"
        >
          <div className="relative overflow-hidden rounded-[28px] shadow-purple print:shadow-none">
            <div className="relative bg-brand-purple px-8 py-14 md:px-14 md:py-20">
              <span className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-lime/10 blur-2xl" />
              <span className="absolute bottom-4 left-8 h-3 w-3 rounded-full border-2 border-brand-lime/60" />
              <span className="absolute right-12 top-6 h-2 w-2 rounded-full bg-brand-orange" />
              <div className="relative flex flex-col items-center text-center">
                <Logo size="xl" subtitle />
                <p className="mt-8 font-display text-base uppercase tracking-[0.32em] text-brand-orange md:text-lg">
                  Minimise the noise. Maximise the impact.
                </p>
              </div>
            </div>

            <div className="relative bg-brand-lime px-8 py-10 text-brand-purple md:px-14 md:py-12">
              <span className="pointer-events-none absolute -right-6 bottom-2 select-none font-display text-[10rem] font-extrabold tracking-tight text-brand-purple/10 md:text-[14rem]">
                mimi
              </span>
              <div className="relative grid gap-8 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-display text-base font-bold md:text-lg">{t.motto}</p>
                  <div className="mt-6 space-y-3 text-sm font-semibold">
                    <a href={`tel:${BRAND_PHONE.replace(/[^+\d]/g, '')}`} className="group flex items-center gap-3 transition hover:text-brand-orange">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-purple text-brand-lime">📞</span>
                      <span>{BRAND_PHONE}</span>
                    </a>
                    <a href="https://wa.me/992070217755" target="_blank" rel="noreferrer" className="group flex items-center gap-3 transition hover:text-brand-orange">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-purple text-brand-lime">💬</span>
                      <span>{t.whatsapp}</span>
                    </a>
                    <a href={BRAND_INSTAGRAM} className="group flex items-center gap-3 transition hover:text-brand-orange">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-purple text-brand-lime">◎</span>
                      <span>{BRAND_INSTAGRAM_HANDLE}</span>
                    </a>
                    <a href={`https://${BRAND_WEB}`} className="group flex items-center gap-3 transition hover:text-brand-orange">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-purple text-brand-lime">▤</span>
                      <span>{BRAND_WEB}</span>
                    </a>
                    <a href={`mailto:${BRAND_EMAIL}`} className="group flex items-center gap-3 transition hover:text-brand-orange">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-purple text-brand-lime">✉</span>
                      <span>{BRAND_EMAIL}</span>
                    </a>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                    {t.services.map((s, i) => (
                      <span key={s}>
                        {i > 0 && <span className="text-brand-purple/40 mr-2">|</span>}
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-end gap-2">
                  <div className="rounded-2xl border-4 border-brand-purple bg-white p-3" role="img" aria-label="QR-код: mimi в Instagram">
                    <QRCodeSVG
                      value={BRAND_INSTAGRAM}
                      size={140}
                      bgColor="#FFFFFF"
                      fgColor="#3C1975"
                      level="M"
                      title="QR-код: mimi в Instagram"
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">scan instagram</span>
                </div>
              </div>
            </div>
          </div>

          <div className="no-print mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => window.print()} className="btn-lime">
              {t.print}
            </button>
            <a href={BRAND_INSTAGRAM} target="_blank" rel="noreferrer" className="btn-ghost">
              {t.openInsta}
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-20 w-full max-w-3xl"
        >
          <h2 className="text-center font-display text-xs uppercase tracking-[0.4em] text-brand-orange">
            {t.valuesTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {t.values.map((v, i) => (
              <div
                key={N[i]}
                className={`glass rounded-2xl p-5 ${v.wide ? 'md:col-span-2' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-xs font-bold text-brand-orange">{N[i]}</span>
                  <h3 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-brand-lime">
                    {v.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm text-light/80">{v.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-brand-orange">
            👉 {t.valuesCta}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
