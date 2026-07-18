/**
 * Builds a single template and produces an upload-ready ZIP at
 * releases/<slug>.zip (index.html at the root of the archive).
 *
 * Usage:
 *   pnpm build:template doctor-appointment
 *   node --loader ts-node/esm tooling/build-and-zip.ts doctor-appointment
 */
import AdmZip from 'adm-zip';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: pnpm build:template <template-slug>');
  process.exit(1);
}

const templateDir = path.join(repoRoot, 'templates', slug);
const distDir = path.join(templateDir, 'dist');
const releasesDir = path.join(repoRoot, 'releases');

if (!fs.existsSync(templateDir)) {
  console.error(`Template not found: templates/${slug}`);
  process.exit(1);
}

console.log(`\n[build-and-zip] Building templates/${slug} ...`);
execSync(`pnpm --filter ${slug} build`, {
  cwd: repoRoot,
  stdio: 'inherit',
});

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error(`Build did not produce dist/index.html for ${slug}`);
  process.exit(1);
}

fs.mkdirSync(releasesDir, { recursive: true });
const zipPath = path.join(releasesDir, `${slug}.zip`);
if (fs.existsSync(zipPath)) fs.rmSync(zipPath);

const zip = new AdmZip();
// Add the CONTENTS of dist/ at the archive root (index.html at top level).
zip.addLocalFolder(distDir);
zip.writeZip(zipPath);

const sizeKb = Math.round(fs.statSync(zipPath).size / 1024);
console.log(`[build-and-zip] Wrote releases/${slug}.zip (${sizeKb} KB)`);
console.log('[build-and-zip] Upload this ZIP via the Templates admin panel.\n');
