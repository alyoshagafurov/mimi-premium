'use client';

import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';
import { RateForm, StarIcon } from './RateForm';

export type PublicReview = {
  id: string; name: string; company: string | null; position: string | null;
  photo: string | null; rating: number; text: string; date: string;
};

const plural = (n: number, [one, few, many]: [string, string, string]) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

const ru = {
  title: 'Как вам работа',
  titleAccent: 'с mimi?',
  lead: 'Поставьте оценку и напишите пару слов. Мы публикуем отзывы после проверки — поэтому здесь только настоящие.',
  read: (n: number) => `Или прочитайте ${n} ${plural(n, ['отзыв', 'отзыва', 'отзывов'])} ↓`,
  listTitle: 'Что говорят',
  listAccent: 'клиенты',
  summary: (avg: string, n: number) => `${avg} из 5 · ${n} ${plural(n, ['отзыв', 'отзыва', 'отзывов'])}`,
  emptyTitle: 'Здесь появятся первые голоса',
  emptyText: 'Мы не пишем отзывы за клиентов и не берём их из шаблонов. Работали с нами? Ваш отзыв может стать первым.',
  emptyCta: 'Оценить работу',
  months: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
  decimal: ',',
};
const en: typeof ru = {
  title: 'How was working',
  titleAccent: 'with mimi?',
  lead: 'Leave a rating and a few words. We publish reviews after checking them, so everything here is real.',
  read: (n) => `Or read ${n} ${n === 1 ? 'review' : 'reviews'} ↓`,
  listTitle: 'What clients',
  listAccent: 'say',
  summary: (avg, n) => `${avg} of 5 · ${n} ${n === 1 ? 'review' : 'reviews'}`,
  emptyTitle: 'The first voices will appear here',
  emptyText: 'We never write reviews for clients or use templates. Worked with us? Yours can be the first.',
  emptyCta: 'Rate our work',
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  decimal: '.',
};
const tg: typeof ru = {
  title: 'Кор бо',
  titleAccent: 'mimi чӣ тавр буд?',
  lead: 'Баҳо гузоред ва чанд сухан нависед. Мо фикрҳоро пас аз санҷиш нашр мекунем — барои ҳамин ин ҷо танҳо фикрҳои воқеӣ ҳастанд.',
  read: (n) => `Ё ${n} фикрро хонед ↓`,
  listTitle: 'Мизоҷон',
  listAccent: 'чӣ мегӯянд',
  summary: (avg, n) => `${avg} аз 5 · ${n} фикр`,
  emptyTitle: 'Ин ҷо аввалин овозҳо пайдо мешаванд',
  emptyText: 'Мо ба ҷои мизоҷон фикр наменависем. Бо мо кор кардаед? Фикри шумо метавонад аввалин бошад.',
  emptyCta: 'Баҳо додан',
  months: ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр'],
  decimal: ',',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export function ReviewsView({ reviews }: { reviews: PublicReview[] }) {
  const t = useCopy(COPY);
  const count = reviews.length;
  const avg = count ? (reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(1).replace('.', t.decimal) : '';
  const when = (iso: string) => {
    const d = new Date(iso);
    return `${t.months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };
  const toStars = () => {
    document.getElementById('rate')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (document.querySelector('#rate [role="radio"]') as HTMLButtonElement | null)?.focus({ preventScroll: true });
  };

  return (
    <main className="relative z-10">
      {/* ── Первый экран: сначала спрашиваем ── */}
      <section id="rate" className="relative mx-auto flex min-h-[86svh] max-w-3xl flex-col items-center px-5 pb-20 pt-32 text-center sm:pt-44">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[340px] -z-10 h-[520px] w-[520px] max-w-[100vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(212,236,76,0.10), transparent)' }}
        />
        <h1 className="font-display text-hero font-extrabold text-light [text-wrap:balance]">
          {t.title} <span className="font-serif font-normal italic text-brand-lime">{t.titleAccent}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[46ch] text-base leading-relaxed text-light/65 sm:text-lg">{t.lead}</p>
        <div className="mt-10 w-full">
          <RateForm />
        </div>
        {count > 0 && (
          <a href="#voices" className="mt-10 text-[13px] text-light/60 underline decoration-white/20 underline-offset-[6px] transition-colors hover:text-brand-lime">
            {t.read(count)}
          </a>
        )}
      </section>

      {/* ── Опубликованные отзывы ── */}
      <section id="voices" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 pb-28 lg:px-12">
        {count === 0 ? (
          <div className="mx-auto max-w-2xl border-t border-white/[0.08] pt-16 text-center">
            <span aria-hidden className="block h-14 font-serif text-[7rem] italic leading-[0.9] text-brand-lime/25">“</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-light [text-wrap:balance] sm:text-4xl">
              {t.emptyTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-[15px] leading-relaxed text-light/60">{t.emptyText}</p>
            <button type="button" onClick={toStars} className="btn-ghost mt-8">
              {t.emptyCta} ↑
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/[0.08] pt-14">
              <h2 className="font-display text-hero-sm font-extrabold text-light">
                {t.listTitle} <span className="font-serif font-normal italic text-brand-lime">{t.listAccent}</span>
              </h2>
              <p className="flex items-center gap-2 font-display text-lg font-bold tabular-nums text-light/80">
                <StarIcon className="h-5 w-5 text-brand-lime" />
                {t.summary(avg, count)}
              </p>
            </div>

            <div className="mt-12 gap-5 sm:columns-2 lg:columns-3">
              {reviews.map((r) => (
                <figure key={r.id} className="relative mb-5 break-inside-avoid rounded-3xl border border-white/[0.06] bg-ink2/60 p-7 pt-9">
                  <span aria-hidden className="absolute left-6 top-2 font-serif text-7xl italic leading-none text-brand-lime/25">“</span>
                  <div className="relative flex gap-0.5 text-brand-lime" aria-label={`${r.rating} / 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <StarIcon key={n} className={n <= r.rating ? 'h-4 w-4' : 'h-4 w-4 text-light/15'} />
                    ))}
                  </div>
                  <blockquote className="relative mt-4 whitespace-pre-line text-[16px] leading-[1.7] text-light/85">{r.text}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
                    {r.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo} alt="" loading="lazy" decoding="async" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple/40 font-display text-sm font-extrabold text-brand-lime">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-light">{r.name}</div>
                      <div className="truncate text-[12px] text-light/55">{[r.position, r.company].filter(Boolean).join(', ') || when(r.date)}</div>
                    </div>
                    {(r.position || r.company) && <span className="shrink-0 text-[11px] text-light/50">{when(r.date)}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
