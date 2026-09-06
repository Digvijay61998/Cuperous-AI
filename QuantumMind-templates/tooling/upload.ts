/**
 * Convenience script for local testing: builds a template, zips it, and POSTs
 * it to the QuantumMind admin API (POST /template) so you skip the manual
 * upload during development.
 *
 * Usage:
 *   ADMIN_API_TOKEN=xxx pnpm upload:template doctor-appointment
 *
 * Reads manifest.json for name/industry/category metadata.
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
  console.error('Usage: pnpm upload:template <template-slug>');
  process.exit(1);
}

const apiBase =
  process.env.ADMIN_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://localhost:4000/api';
const token = process.env.ADMIN_API_TOKEN || '';

const templateDir = path.join(repoRoot, 'templates', slug);
const distDir = path.join(templateDir, 'dist');
const manifestPath = path.join(templateDir, 'manifest.json');

async function main() {
  console.log(`\n[upload] Building templates/${slug} ...`);
  execSync(`pnpm --filter ${slug} build`, { cwd: repoRoot, stdio: 'inherit' });

  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error(`Build did not produce dist/index.html for ${slug}`);
  }

  const zip = new AdmZip();
  zip.addLocalFolder(distDir);
  const zipBuffer = zip.toBuffer();

  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    : {};

  const form = new FormData();
  form.append('name', manifest.name || slug);
  form.append('description', manifest.description || '');
  form.append('industry', manifest.industry || 'other');
  form.append('category', manifest.category || 'other');
  form.append('tags', JSON.stringify(manifest.tags || []));
  form.append(
    'template',
    new Blob([zipBuffer], { type: 'application/zip' }),
    `${slug}.zip`,
  );

  console.log(`[upload] POST ${apiBase}/template ...`);
  const res = await fetch(`${apiBase}/template`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form as any,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  console.log(`[upload] Done. Template id: ${data.id || data._id}`);
  console.log(`[upload] Hosted at: ${data.hostedUrl}\n`);
}

main().catch((err) => {
  console.error('[upload] Error:', err.message);
  process.exit(1);
});
