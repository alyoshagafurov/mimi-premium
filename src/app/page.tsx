import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import { LandingClient } from './LandingClient';

const HOME_TITLE = 'Маркетинговое агентство в Душанбе — mimi (mimitj)';
const HOME_DESCRIPTION =
  'mimi (mimitj) — маркетинговое агентство полного цикла в Душанбе и Таджикистане: таргетированная реклама, SMM, брендинг, Meta Ads, маркетинговая стратегия, дизайн и креативы. Системный маркетинг без хаоса и лишних затрат.';

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: HOME_TITLE, description: HOME_DESCRIPTION },
};

export default async function Home() {
  const session = await getSafeSession();
  if (session?.user) {
    const role = (session.user as any).role;
    redirect(role === 'ADMIN' ? '/admin' : '/dashboard');
  }
  return <LandingClient />;
}
