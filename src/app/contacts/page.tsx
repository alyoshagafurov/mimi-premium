'use client';

import { TopNav } from '@/components/ui/TopNav';
import { Footer } from '@/components/ui/Footer';
import { useCopy } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/config';
import { BRAND } from '@/lib/seo';
import { MAP_RATIO, PresenceMap } from './PresenceMap';
import { RequestForm } from './RequestForm';
import { ArrowUpRight, ChatIcon, FormIcon, InstagramIcon, MailIcon, PhoneIcon } from './icons';

const INSTAGRAM_HANDLE = '@' + BRAND.instagram.replace(/\/+$/, '').split('/').pop();

const ru = {
  title: 'Давайте',
  titleAccent: 'поговорим.',
  lead: 'Расскажите, что сейчас происходит с вашим маркетингом. Удобнее переписываться — пишите в WhatsApp. Удобнее, чтобы вам позвонили, — оставьте заявку.',
  wa: 'Написать в WhatsApp',
  request: 'Оставить заявку',
  call: 'Позвонить',
  mail: 'Написать на почту',
  insta: 'Смотреть Instagram',
  mapTitle: 'Схема: Душанбе и города Таджикистана, где работает mimi',
  base: 'наша база',
  legend: 'Работаем с бизнесом в шести городах Таджикистана',
  cities: { dushanbe: 'Душанбе', khujand: 'Худжанд', istaravshan: 'Истаравшан', tursunzoda: 'Турсунзаде', bokhtar: 'Бохтар', kulob: 'Куляб' },
  reqTitle: 'Расскажите',
  reqAccent: 'о задаче.',
  reqLead: 'Имя, телефон и пара слов о бизнесе — этого достаточно. Мы перезвоним и разберёмся вместе.',
  valuesTitle: 'Во что мы верим',
  values: [
    ['Умная эффективность', 'Каждое решение — на смысле, стратегии и реальной пользе бренда.'],
    ['Результат как репутация', 'Наше имя строится не на словах, а на кейсах.'],
    ['Партнёрство', 'Мы не подрядчик. Мы часть вашей команды.'],
  ],
  motto: 'Меньше шума, больше смысла.',
};
const en: typeof ru = {
  title: 'Let’s',
  titleAccent: 'talk.',
  lead: 'Tell us what is going on with your marketing. Prefer chatting — message us on WhatsApp. Prefer a call — leave a request.',
  wa: 'Message on WhatsApp',
  request: 'Leave a request',
  call: 'Call',
  mail: 'Email us',
  insta: 'See Instagram',
  mapTitle: 'Map: Dushanbe and the cities of Tajikistan where mimi works',
  base: 'our base',
  legend: 'We work with businesses in six cities of Tajikistan',
  cities: { dushanbe: 'Dushanbe', khujand: 'Khujand', istaravshan: 'Istaravshan', tursunzoda: 'Tursunzoda', bokhtar: 'Bokhtar', kulob: 'Kulob' },
  reqTitle: 'Tell us',
  reqAccent: 'about the task.',
  reqLead: 'Your name, phone and a few words about the business are enough. We will call back and figure it out together.',
  valuesTitle: 'What we believe in',
  values: [
    ['Smart efficiency', 'Every decision is based on meaning, strategy and real brand value.'],
    ['Results as reputation', 'Our name is built on cases, not words.'],
    ['Partnership', 'We are not a contractor. We are part of your team.'],
  ],
  motto: 'Less noise, more meaning.',
};
const tg: typeof ru = {
  title: 'Биёед',
  titleAccent: 'гап занем.',
  lead: 'Бигӯед, ки бо маркетинги шумо ҳоло чӣ мегузарад. Навиштан қулай бошад — ба WhatsApp нависед. Занг қулай бошад — дархост гузоред.',
  wa: 'Навиштан дар WhatsApp',
  request: 'Дархост гузоштан',
  call: 'Занг задан',
  mail: 'Ба почта навиштан',
  insta: 'Дидани Instagram',
  mapTitle: 'Нақша: Душанбе ва шаҳрҳои Тоҷикистон, ки mimi кор мекунад',
  base: 'пойгоҳи мо',
  legend: 'Бо тиҷорат дар шаш шаҳри Тоҷикистон кор мекунем',
  cities: { dushanbe: 'Душанбе', khujand: 'Хуҷанд', istaravshan: 'Истаравшан', tursunzoda: 'Турсунзода', bokhtar: 'Бохтар', kulob: 'Кӯлоб' },
  reqTitle: 'Дар бораи',
  reqAccent: 'вазифа бигӯед.',
  reqLead: 'Ном, телефон ва чанд сухан дар бораи тиҷорат кифоя аст. Мо занг мезанем ва якҷоя ҳал мекунем.',
  valuesTitle: 'Мо ба чӣ бовар дорем',
  values: [
    ['Самаранокии зиракона', 'Ҳар як қарор бар асоси маъно, стратегия ва фоидаи воқеии бренд аст.'],
    ['Натиҷа ҳамчун обрӯ', 'Номи мо на бо суханон, балки бо кейсҳо сохта мешавад.'],
    ['Шарикӣ', 'Мо пудратчӣ нестем. Мо қисми дастаи шумоем.'],
  ],
  motto: 'Камтар садо, бештар маъно.',
};
const COPY: Record<Lang, typeof ru> = { ru, en, tg };

export default function ContactsPage() {
  const t = useCopy(COPY);

  const toRequest = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('rq-name')?.focus({ preventScroll: true });
  };

  const channels = [
    { href: `tel:${BRAND.phoneE164}`, label: t.call, value: BRAND.phoneDisplay, Icon: PhoneIcon, external: false },
    { href: `mailto:${BRAND.email}`, label: t.mail, value: BRAND.email, Icon: MailIcon, external: false },
    { href: BRAND.instagram, label: t.insta, value: INSTAGRAM_HANDLE, Icon: InstagramIcon, external: true },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <TopNav />
      <main className="relative z-10 mx-auto max-w-[1500px] px-5 pb-24 pt-28 sm:pt-32 lg:px-12 lg:pt-40">
        <div className="grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12">
          {/* ── Заголовок и два равных действия ── */}
          <div className="lg:col-span-5 lg:row-start-1">
            <h1 className="font-display text-[clamp(3.25rem,7.5vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.035em] text-light">
              {t.title}
              <br />
              <span className="font-serif font-normal italic tracking-[-0.02em] text-brand-lime">{t.titleAccent}</span>
            </h1>
            <p className="mt-7 max-w-[44ch] text-base leading-relaxed text-light/65 sm:text-[17px]">{t.lead}</p>
            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" className="btn-lime w-full whitespace-nowrap !px-5 !tracking-[0.12em]">
                <ChatIcon className="h-[18px] w-[18px]" /> {t.wa}
              </a>
              <a
                href="#request"
                onClick={toRequest}
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-orange px-5 py-3.5 font-display text-[13px] font-bold uppercase tracking-[0.12em] text-[#0A0712] shadow-[0_10px_35px_-12px_rgba(252,150,3,0.65)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <FormIcon className="h-[18px] w-[18px]" /> {t.request}
              </a>
            </div>
          </div>

          {/* ── Карта присутствия ── */}
          <figure className="mt-14 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:mt-0">
            <div style={{ aspectRatio: MAP_RATIO }} className="relative overflow-hidden rounded-[32px] border border-white/[0.07] bg-ink2/40">
              <PresenceMap names={t.cities} base={t.base} title={t.mapTitle} />
            </div>
            <figcaption className="mt-4 flex items-center gap-3 text-[13px] text-light/60">
              <span aria-hidden className="h-2 w-2 rounded-full bg-brand-lime" />
              {t.legend}
            </figcaption>
          </figure>

          {/* ── Каналы связи ── */}
          <ul className="mt-12 border-y border-white/[0.07] lg:col-span-5 lg:row-start-2 lg:mt-14 lg:self-start">
            {channels.map(({ href, label, value, Icon, external }) => (
              <li key={href} className="border-b border-white/[0.07] last:border-0">
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="group flex items-center gap-4 py-5 outline-none focus-visible:bg-white/[0.03]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-brand-lime transition-colors group-hover:border-brand-lime/50">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] text-light/55">{label}</span>
                    <span className="block truncate font-display text-lg font-bold tabular-nums text-light transition-colors group-hover:text-brand-lime sm:text-xl">
                      {value}
                    </span>
                  </span>
                  <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-light/30 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-lime" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Заявка ── */}
        <section id="request" className="mt-24 grid scroll-mt-24 border-t border-white/[0.08] pt-16 lg:mt-32 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:pt-24">
          <div className="lg:col-span-5 lg:row-start-1">
            <h2 className="font-display text-hero-sm font-extrabold text-light">
              {t.reqTitle} <span className="font-serif font-normal italic text-brand-orange">{t.reqAccent}</span>
            </h2>
            <p className="mt-5 max-w-[44ch] text-base leading-relaxed text-light/65">{t.reqLead}</p>
          </div>
          {/* На телефоне форма идёт сразу за заголовком, ценности — после неё. */}
          <div className="mt-10 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:mt-0">
            <RequestForm />
          </div>
          <div className="mt-14 lg:col-span-5 lg:row-start-2 lg:mt-12">
            <h3 className="font-display text-sm font-bold text-light/80">{t.valuesTitle}</h3>
            <ul className="mt-5 space-y-5">
              {t.values.map(([title, body]) => (
                <li key={title} className="border-l border-brand-purpleSoft/40 pl-5">
                  <p className="font-serif text-2xl italic leading-tight text-light">{title}</p>
                  <p className="mt-1 max-w-[46ch] text-[15px] leading-relaxed text-light/60">{body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 font-serif text-xl italic text-brand-lime">{t.motto}</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
