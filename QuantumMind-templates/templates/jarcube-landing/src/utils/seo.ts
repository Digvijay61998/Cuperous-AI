import type { FaqEntry, RouteDef } from '../types';
import { site } from '../content/site';

/**
 * SEO metadata helpers.
 *
 * The site is a multi-page build, so each route's metadata is baked into its
 * own HTML document at build time rather than swapped in by client-side
 * routing. Crawlers see the real thing on first request.
 */

/** Absolute URL for a route path. */
export function absoluteUrl(path: string): string {
  const base = site.baseUrl.replace(/\/$/, '');
  if (path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Default social share image. */
export const ogImagePath = '/assets/og-default.png';

export interface MetaTag {
  /** Either name= or property= depending on the vocabulary. */
  attr: 'name' | 'property';
  key: string;
  value: string;
}

/**
 * Build the full meta set for a route: description, Open Graph, Twitter card.
 */
export function buildMetaTags(route: RouteDef): MetaTag[] {
  const url = absoluteUrl(route.path);
  const image = absoluteUrl(ogImagePath);
  const isHome = route.path === '/';

  return [
    { attr: 'name', key: 'description', value: route.description },

    { attr: 'property', key: 'og:title', value: route.title },
    { attr: 'property', key: 'og:description', value: route.description },
    { attr: 'property', key: 'og:type', value: isHome ? 'website' : 'article' },
    { attr: 'property', key: 'og:url', value: url },
    { attr: 'property', key: 'og:image', value: image },
    { attr: 'property', key: 'og:site_name', value: site.brandName },

    { attr: 'name', key: 'twitter:card', value: 'summary_large_image' },
    { attr: 'name', key: 'twitter:title', value: route.title },
    { attr: 'name', key: 'twitter:description', value: route.description },
    { attr: 'name', key: 'twitter:image', value: image },
  ];
}

/** Organization structured data for the landing page. */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.brandName,
    url: site.baseUrl,
    description: site.tagline,
    sameAs: site.socials.map((s) => s.url),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: `+${site.whatsappNumber}`,
        email: site.emails[0]?.address,
        availableLanguage: ['en'],
      },
    ],
  };
}

/**
 * FAQPage structured data, generated from the same FAQ entries the page
 * renders — so the markup and the structured data cannot describe different
 * questions.
 */
export function faqJsonLd(entries: FaqEntry[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer },
    })),
  };
}
