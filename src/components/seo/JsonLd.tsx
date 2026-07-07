import { SITE_URL, SITE_NAME, SITE_LEGAL_NAME, DEFAULT_DESCRIPTION, BRAND } from '@/lib/seo';

/**
 * Site-wide JSON-LD structured data (rendered once in the root layout).
 * Organization + LocalBusiness + WebSite, with @id cross-references so Google
 * treats them as one connected entity graph.
 */
export function SiteJsonLd() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        legalName: SITE_LEGAL_NAME,
        alternateName: ['mimitj', 'mimi tj', 'mimi agency'],
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/icon.svg`,
          width: 512,
          height: 512,
        },
        description: DEFAULT_DESCRIPTION,
        email: BRAND.email,
        telephone: BRAND.phoneE164,
        areaServed: [
          { '@type': 'City', name: BRAND.city },
          { '@type': 'Country', name: BRAND.region },
        ],
        sameAs: [BRAND.instagram, BRAND.whatsapp],
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: SITE_NAME,
        image: `${SITE_URL}/opengraph-image`,
        url: SITE_URL,
        telephone: BRAND.phoneE164,
        email: BRAND.email,
        priceRange: '$$',
        description: DEFAULT_DESCRIPTION,
        address: {
          '@type': 'PostalAddress',
          addressLocality: BRAND.city,
          addressCountry: BRAND.countryCode,
        },
        areaServed: [
          { '@type': 'City', name: BRAND.city },
          { '@type': 'Country', name: BRAND.region },
        ],
        sameAs: [BRAND.instagram, BRAND.whatsapp],
        parentOrganization: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: 'ru-RU',
        description: DEFAULT_DESCRIPTION,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

/** Per-page BreadcrumbList JSON-LD. Pass ordered [{ name, path }]. */
export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
