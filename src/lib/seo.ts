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
};

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
