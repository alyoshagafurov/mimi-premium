import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Manrope, Outfit, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { DEFAULT_LANG, LANG_COOKIE, isLang } from '@/i18n/config';
import { PWAInstaller } from '@/components/ui/PWAInstaller';

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
  title: 'mimi — minimise marketing agency',
  description:
    'Minimise the noise. Maximise the impact. Маркетинговое агентство полного цикла: стратегия, брендинг, таргетинг, дизайн.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  manifest: '/manifest.json',
  themeColor: '#3C1975',
  appleWebApp: { title: 'mimi', capable: true, statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLang = cookies().get(LANG_COOKIE)?.value;
  const lang = isLang(cookieLang) ? cookieLang : DEFAULT_LANG;

  return (
    <html lang={lang} className={`${manrope.variable} ${moderustic.variable} ${serif.variable}`}>
      <body className="font-sans antialiased">
        <Providers initialLang={lang}>{children}</Providers>
        <PWAInstaller />
      </body>
    </html>
  );
}
