import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Manrope, Outfit, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { DEFAULT_LANG, LANG_COOKIE, isLang } from '@/i18n/config';
import { PWAInstaller } from '@/components/ui/PWAInstaller';
import { SiteJsonLd } from '@/components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, CORE_KEYWORDS } from '@/lib/seo';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
});

// Outfit — geometric sans for display (closest to brandbook Moderustic)
const moderustic = Outfit({
  subsets: ['latin'],
  variable: '--font-moderustic',
  weight: ['400', '500', '600', '700', '800', '900'],
});

// Instrument Serif — editorial accent for headline emphasis & quotes
const serif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: CORE_KEYWORDS,
  category: 'marketing',
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  manifest: '/manifest.json',
  alternates: { canonical: '/' },
  formatDetection: { telephone: true, email: true, address: true },
  appleWebApp: { title: 'mimi', capable: true, statusBarStyle: 'black-translucent' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  // Legacy local-geo hints (used by some local search engines/directories).
  other: {
    'geo.region': 'TJ-DU',
    'geo.placename': 'Душанбе',
    'geo.position': '38.5598;68.787',
    ICBM: '38.5598, 68.787',
  },
};

export const viewport: Viewport = {
  themeColor: '#3C1975',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLang = cookies().get(LANG_COOKIE)?.value;
  const lang = isLang(cookieLang) ? cookieLang : DEFAULT_LANG;

  return (
    <html lang={lang} className={`${manrope.variable} ${moderustic.variable} ${serif.variable}`}>
      <body className="font-sans antialiased">
        <SiteJsonLd />
        <Providers initialLang={lang}>{children}</Providers>
        <PWAInstaller />
      </body>
    </html>
  );
}
