/**
 * Generates one HTML entry document per route from the route manifest.
 *
 * Run this whenever routes.ts changes. Generating rather than hand-writing 21
 * files means every document gets the same head structure, and a route's title,
 * description, canonical and OG tags come from the one place they are declared.
 *
 *   pnpm --filter jarcube-landing gen:html
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routes } from '../src/content/routes';
import { site } from '../src/content/site';
import { faq } from '../src/content/faq';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');

const base = site.baseUrl.replace(/\/$/, '');
const ogImage = `${base}/assets/og-default.png`;

/** Escape for use in an HTML attribute or text node. */
const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Relative depth prefix, so assets resolve under `base: './'`. */
const depthPrefix = (htmlPath: string): string => {
  const depth = htmlPath.split('/').length - 1;
  return depth === 0 ? './' : '../'.repeat(depth);
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.brandName,
  url: base,
  description: site.tagline,
  sameAs: site.socials.map((s) => s.url),
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((e) => ({
    '@type': 'Question',
    name: e.question,
    acceptedAnswer: { '@type': 'Answer', text: e.answer },
  })),
};

let written = 0;

for (const route of routes) {
  const canonical = route.path === '/' ? `${base}/` : `${base}${route.path}`;
  const prefix = depthPrefix(route.htmlPath);
  const isHome = route.path === '/';

  // Structured data: Organization plus FAQPage on the landing page only.
  const jsonLdBlocks = isHome
    ? [organizationJsonLd, faqJsonLd]
    : [organizationJsonLd];

  const jsonLd = jsonLdBlocks
    .map(
      (block) =>
        `    <script type="application/ld+json">\n${JSON.stringify(block, null, 6)
          .split('\n')
          .map((l) => `      ${l}`)
          .join('\n')}\n    </script>`,
    )
    .join('\n');

  const robots = route.noIndex
    ? '    <meta name="robots" content="noindex" />\n'
    : '';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#4338CA" />

    <title>${esc(route.title)}</title>
    <meta name="description" content="${esc(route.description)}" />
${robots}    <link rel="canonical" href="${canonical}" />

    <meta property="og:site_name" content="${esc(site.brandName)}" />
    <meta property="og:title" content="${esc(route.title)}" />
    <meta property="og:description" content="${esc(route.description)}" />
    <meta property="og:type" content="${isHome ? 'website' : 'article'}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(route.title)}" />
    <meta name="twitter:description" content="${esc(route.description)}" />
    <meta name="twitter:image" content="${ogImage}" />

    <link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap"
    />

${jsonLd}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${prefix}src/entries/${route.entryName}.tsx"></script>
  </body>
</html>
`;

  const outPath = path.join(pkgRoot, route.htmlPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  written += 1;
}

console.log(`[gen-html] Wrote ${written} HTML entry documents.`);
