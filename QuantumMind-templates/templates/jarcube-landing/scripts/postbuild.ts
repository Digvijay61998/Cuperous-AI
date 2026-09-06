/**
 * Post-build step.
 *
 * Emits sitemap.xml and robots.txt from the same route manifest that produced
 * the Vite build inputs. Deriving both from one array is what guarantees a
 * route cannot be built without a sitemap entry, or listed in the sitemap
 * without a corresponding file — rather than relying on someone remembering to
 * update two places.
 *
 * Also verifies the emitted output shape and reports the gzipped bundle size.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { routes, indexableRoutes } from '../src/content/routes';
import { site } from '../src/content/site';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const distDir = path.join(pkgRoot, 'dist');

const BUDGET_KB = 350;

if (!fs.existsSync(distDir)) {
  console.error('[postbuild] dist/ not found — run the Vite build first.');
  process.exit(1);
}

// --- sitemap.xml ----------------------------------------------------------

const base = site.baseUrl.replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

/** Landing page ranks highest, section indexes above their detail pages. */
const priorityFor = (routePath: string): string => {
  if (routePath === '/') return '1.0';
  if (routePath.startsWith('/legal/')) return '0.3';
  const depth = routePath.split('/').filter(Boolean).length;
  return depth === 1 ? '0.8' : '0.6';
};

const urlEntries = indexableRoutes()
  .map((r) => {
    const loc = r.path === '/' ? `${base}/` : `${base}${r.path}`;
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <priority>${priorityFor(r.path)}</priority>`,
      '  </url>',
    ].join('\n');
  })
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');

// --- robots.txt -----------------------------------------------------------

const robots = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;

fs.writeFileSync(path.join(distDir, 'robots.txt'), robots, 'utf8');

// --- Verify output shape -------------------------------------------------

const missing: string[] = [];
for (const route of routes) {
  const expected = path.join(distDir, route.htmlPath);
  if (!fs.existsSync(expected)) missing.push(route.htmlPath);
}

if (missing.length > 0) {
  console.error('[postbuild] Expected HTML files were not emitted:');
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}

// index.html at the dist root is what tooling/build-and-zip.ts checks for.
if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('[postbuild] dist/index.html is missing.');
  process.exit(1);
}

// --- Bundle budget ------------------------------------------------------

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

let gzippedBytes = 0;
for (const file of walk(distDir)) {
  if (/\.(js|css)$/.test(file)) {
    gzippedBytes += gzipSync(fs.readFileSync(file)).length;
  }
}

const gzippedKb = Math.round(gzippedBytes / 1024);

console.log(`[postbuild] ${routes.length} routes emitted`);
console.log(`[postbuild] sitemap.xml — ${indexableRoutes().length} indexable URLs`);
console.log(`[postbuild] JS + CSS gzipped: ${gzippedKb} KB (budget ${BUDGET_KB} KB)`);

if (gzippedKb > BUDGET_KB) {
  console.error(`[postbuild] Bundle budget exceeded by ${gzippedKb - BUDGET_KB} KB.`);
  process.exit(1);
}

console.log('[postbuild] OK');
