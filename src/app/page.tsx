import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import { FaqJsonLd } from '@/components/seo/JsonLd';
import { LandingClient } from './LandingClient';
import type { CmsData } from '@/components/landing/CmsSections';

const EMPTY_CMS: CmsData = {
  cases: [], testimonials: [], clients: [], team: [], stats: [], posts: [], partners: [], certificates: [], awards: [], faqs: [],
};

/** Load all published CMS content for the landing (empty on DB error → landing stays identical). */
async function loadCms(): Promise<CmsData> {
  try {
    const pubSort = { where: { published: true }, orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'desc' as const }] };
    const [cases, testimonials, clients, team, stats, posts, partners, certificates, awards, faqs] = await Promise.all([
      prisma.case.findMany({ where: { published: true }, orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }], take: 6, select: { id: true, slug: true, title: true, category: true, clientName: true, description: true, coverImage: true } }),
      prisma.testimonial.findMany({ where: { published: true }, orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }], take: 6, select: { id: true, name: true, company: true, position: true, photo: true, rating: true, text: true } }),
      prisma.clientLogo.findMany({ ...pubSort, select: { id: true, name: true, logo: true, url: true } }),
      prisma.teamMember.findMany({ ...pubSort, select: { id: true, name: true, position: true, photo: true, bio: true, socials: true } }),
      prisma.companyStat.findMany({ ...pubSort, select: { id: true, label: true, value: true, suffix: true } }),
      prisma.blogPost.findMany({ where: { published: true }, orderBy: { date: 'desc' }, take: 3, select: { id: true, slug: true, title: true, category: true, cover: true, excerpt: true, date: true } }),
      prisma.partner.findMany({ ...pubSort, select: { id: true, name: true, logo: true, url: true } }),
      prisma.certificate.findMany({ ...pubSort, select: { id: true, title: true, image: true, issuer: true } }),
      prisma.award.findMany({ ...pubSort, select: { id: true, title: true, image: true, issuer: true } }),
      prisma.faq.findMany({ ...pubSort, select: { id: true, question: true, answer: true } }),
    ]);
    return JSON.parse(JSON.stringify({ cases, testimonials, clients, team, stats, posts, partners, certificates, awards, faqs }));
  } catch {
    return EMPTY_CMS;
  }
}

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
  const cms = await loadCms();
  return (
    <>
      <FaqJsonLd />
      <LandingClient cms={cms} />
    </>
  );
}
