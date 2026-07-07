import type { Metadata } from 'next';

/**
 * Central SEO configuration for mimi (mimitj.agency).
 * One source of truth for the domain, brand NAP data, and per-page metadata.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://mimitj.agency').replace(/\/$/, '');
export const SITE_NAME = 'mimi';
export const SITE_LEGAL_NAME = 'mimi — маркетинговое агентство';

// NAP (name / address / phone) — keep identical everywhere for local SEO.
export const BRAND = {
  phoneDisplay: '+992 07 021 77 55',
  phoneE164: '+992070217755',
  whatsapp: 'https://wa.me/992070217755',
  email: process.env.NEXT_PUBLIC_BRAND_EMAIL ?? 'hello@mimitj.agency',
  instagram: process.env.NEXT_PUBLIC_BRAND_INSTAGRAM ?? 'https://instagram.com/mimi.agency.tj',
  city: 'Душанбе',
  region: 'Таджикистан',
  countryCode: 'TJ',
  // Dushanbe city centre — improves local pack relevance.
  geo: { lat: 38.5598, lng: 68.787 },
};

// Cities served across Tajikistan (local SEO reach).
export const AREA_SERVED = ['Душанбе', 'Худжанд', 'Бохтар', 'Куляб', 'Истаравшан', 'Турсунзаде'];

// Services offered — used for the Organization OfferCatalog (schema.org).
export const SERVICES = [
  'Таргетированная реклама',
  'SMM — ведение соцсетей',
  'Брендинг',
  'Маркетинговая стратегия',
  'Графический дизайн и креативы',
  'Meta Ads (Facebook и Instagram)',
  'Разработка сайтов',
];

// FAQ for FAQPage structured data (mirrors the visible FAQ, Russian default).
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Сколько занимает запуск маркетинга?',
    a: '7–14 дней в зависимости от тарифа и готовности материалов. PRO — быстрее, ELITE — полная стратегия и брендинг до старта. Точный план даём на брифе.',
  },
  {
    q: 'Какие гарантии даёт агентство?',
    a: 'Мы не обещаем «лиды в первый день». Обещаем прозрачность: вы видите все цифры в личном кабинете и остаётесь постоянно на связи с маркетинговой командой.',
  },
  {
    q: 'Можно начать с одной услуги?',
    a: 'Да. Тариф PRO включает только таргетированную рекламу и аналитику. STANDART и ELITE — система, где все каналы работают вместе и усиливают друг друга.',
  },
  {
    q: 'Вы работаете по всему Таджикистану?',
    a: 'Да. Офис в Душанбе, работаем с бизнесом по всему Таджикистану: таргет, SMM, брендинг, Meta Ads, стратегия и дизайн — онлайн и на месте.',
  },
  {
    q: 'Что внутри личного кабинета клиента?',
    a: 'Дашборд с KPI, ROMI, воронкой, лидами и активными кампаниями. Обновляется по мере поступления метрик. Доступ — после оплаты тарифа.',
  },
];

export const DEFAULT_TITLE = 'mimi — маркетинговое агентство в Душанбе и Таджикистане';
export const DEFAULT_DESCRIPTION =
  'mimi (mimitj) — маркетинговое агентство полного цикла в Душанбе: таргетированная реклама, SMM, брендинг, Meta Ads, маркетинговая стратегия, дизайн и креативы для роста бизнеса.';

// Keywords used across the site (light — Google mostly ignores the tag, but it is harmless and requested).
export const CORE_KEYWORDS = [
  'mimitj',
  'mimi tj',
  'mimi agency',
  'маркетинговое агентство Душанбе',
  'маркетинговое агентство Таджикистан',
  'таргетолог Душанбе',
  'таргетированная реклама Душанбе',
  'SMM Душанбе',
  'брендинг Душанбе',
  'Meta Ads Душанбе',
  'маркетинг Душанбе',
  'реклама в Instagram Душанбе',
];

type PageMetaInput = {
  title: string;
  description: string;
  path: string; // e.g. '/pricing' or '' for home
  keywords?: string[];
  index?: boolean; // default true
  ogTitle?: string;
};

/** Build complete, self-consistent Metadata for a page (canonical, OG, Twitter, robots). */
export function pageMetadata({ title, description, path, keywords, index = true, ogTitle }: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    keywords: keywords ?? CORE_KEYWORDS,
    alternates: { canonical: url || '/' },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } }
      : { index: false, follow: false },
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      url: url || SITE_URL,
      siteName: SITE_NAME,
      title: ogTitle ?? title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle ?? title,
      description,
    },
  };
}
