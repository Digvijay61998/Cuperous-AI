#!/usr/bin/env node
/**
 * verify-docs.mjs — read-only integrity checker for the OpenWA analysis doc set.
 *
 * Why this exists
 * ---------------
 * The value of this doc set is that it can be trusted as pre-loaded context. With thousands
 * of file-path citations spread over ~62 documents, manual accuracy is not achievable, and a
 * doc that confidently cites a file which does not exist is worse than no doc at all.
 *
 * Checks
 * ------
 *  1. PATHS      Every backticked token that looks like a repo path resolves on disk.
 *  2. SYMBOLS    Every `path.ts:SymbolName` citation — SymbolName appears in that file.
 *  3. XREF       Every `NN-name.md` reference resolves to a doc in this set.
 *  4. TEMPLATE   Every band doc contains the required `##` headings.
 *  5. CLASS      Every band doc declares exactly one valid Jarcube portability label.
 *  6. COUNTS     Hard-coded counted facts are asserted against the live source tree.
 *  7. INVENTORY  Every source file appears in Appendix E (enabled once Appendix E lands).
 *
 * Usage
 * -----
 *   node verify-docs.mjs            # run all enabled checks
 *   node verify-docs.mjs --strict   # also run checks gated as "pending" (inventory)
 *
 * Exit code is non-zero on any failure.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(DOCS_DIR, '..', '..');
const OPENWA_ROOT = join(WORKSPACE_ROOT, 'OpenWA');

const STRICT = process.argv.includes('--strict');

/* ------------------------------------------------------------------ *
 * Path roots
 * ------------------------------------------------------------------ */

// First path segment -> base directory the token is resolved against.
const PATH_ROOTS = [
  { prefix: 'src/', base: OPENWA_ROOT },
  { prefix: 'dashboard/', base: OPENWA_ROOT },
  { prefix: 'sdk/', base: OPENWA_ROOT },
  { prefix: 'scripts/', base: OPENWA_ROOT },
  { prefix: 'charts/', base: OPENWA_ROOT },
  { prefix: 'test/', base: OPENWA_ROOT },
  { prefix: 'docs/', base: OPENWA_ROOT },
  { prefix: 'data/', base: OPENWA_ROOT },
  { prefix: '.github/', base: OPENWA_ROOT },
  { prefix: 'OpenWA/', base: WORKSPACE_ROOT },
  { prefix: 'QuantumMind-backend/', base: WORKSPACE_ROOT },
  { prefix: 'QuantumMind-ui/', base: WORKSPACE_ROOT },
  { prefix: 'QuantumMind-ai/', base: WORKSPACE_ROOT },
  { prefix: 'QuantumMind-templates/', base: WORKSPACE_ROOT },
  { prefix: 'QuantumMind-widget/', base: WORKSPACE_ROOT },
];

/**
 * Paths that are part of the deployment contract but only exist after a build or at runtime.
 * Citing them is correct; requiring them on disk would make the checker depend on build state.
 */
const GENERATED_PATHS = new Set([
  'dashboard/dist',
  'dashboard/dist/index.html',
  'dist',
  'dist/main.js',
  'dist/database/data-source.js',
  'dist/database/data-source-main.js',
  'data/main.sqlite',
  'data/openwa.sqlite',
  'data/.env.generated',
  'data/.api-key',
  'data/media',
  'data/sessions',
  'data/baileys',
  'data/plugins',
]);

// Bare filenames at the OpenWA repo root that are worth verifying when cited.
const ROOT_FILES = new Set([
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'nest-cli.json',
  'openapi.json',
  'Dockerfile',
  '.dockerignore',
  'docker-entrypoint.sh',
  'docker-compose.yml',
  'docker-compose.dev.yml',
  'docker-compose.local.yml',
  '.env.example',
  '.env.minimal',
  '.nvmrc',
  '.prettierrc',
  '.prettierignore',
  '.trivyignore',
  'CHANGELOG.md',
  'README.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'LICENSE',
  'eslint.config.mjs',
]);

/* ------------------------------------------------------------------ *
 * Template + classification contract
 * ------------------------------------------------------------------ */

const REQUIRED_HEADINGS = [
  '## Purpose',
  '## File Inventory',
  '## Jarcube Portability',
];

const CLASS_LABELS = ['PORTABLE', 'ENGINE-COUPLED', 'NEEDS-REDESIGN', 'SKIP', 'MIXED'];

// Docs exempt from the band-doc template (index, template, appendices, porting docs).
const TEMPLATE_EXEMPT = /^(00-INDEX|_TEMPLATE|APPENDIX-[A-E]|9[89]-)/;

/* ------------------------------------------------------------------ *
 * Counted facts, asserted against the live tree
 * ------------------------------------------------------------------ */

function countOpenApiOperations() {
  const specPath = join(OPENWA_ROOT, 'openapi.json');
  if (!existsSync(specPath)) return null;
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  const methods = ['get', 'post', 'put', 'patch', 'delete'];
  let ops = 0;
  for (const p of Object.keys(spec.paths ?? {})) {
    ops += Object.keys(spec.paths[p]).filter(m => methods.includes(m)).length;
  }
  return {
    paths: Object.keys(spec.paths ?? {}).length,
    operations: ops,
    schemas: Object.keys(spec.components?.schemas ?? {}).length,
  };
}

function countFilesMatching(dir, predicate) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const entry of walk(dir)) if (predicate(entry)) n++;
  return n;
}

/** Test files are not the artefact being counted. Excluding them keeps a count marker meaningful. */
function isTestFile(p) {
  return /\.spec\.|\.test\.|__tests__|__fixtures__|__mocks__/.test(p);
}

/** Capability keys on the engine interface, derived with the matrix's own member regex. */
function countEngineCapabilities() {
  const ifacePath = join(OPENWA_ROOT, 'src/engine/interfaces/whatsapp-engine.interface.ts');
  if (!existsSync(ifacePath)) return null;
  const src = readFileSync(ifacePath, 'utf8');
  const names = new Set();
  for (const line of src.split('\n')) {
    const m = line.match(/^\s{2}([a-zA-Z][a-zA-Z0-9]*)\??\s*\(/);
    if (m) names.add(m[1]);
  }
  return names.size;
}

const COUNTED_FACTS = [
  {
    doc: '71-migrations.md',
    label: 'data-connection migration count',
    marker: /<!--\s*COUNT:migrations=(\d+)\s*-->/,
    actual: () =>
      countFilesMatching(
        join(OPENWA_ROOT, 'src/database/migrations'),
        f => f.endsWith('.ts') && !isTestFile(f),
      ),
  },
  {
    doc: '70-database-design.md',
    label: 'entity count',
    marker: /<!--\s*COUNT:entities=(\d+)\s*-->/,
    actual: () =>
      countFilesMatching(join(OPENWA_ROOT, 'src'), f => f.endsWith('.entity.ts') && !isTestFile(f)),
  },
  {
    doc: '12-engine-capability-matrix.md',
    label: 'engine capability count',
    marker: /<!--\s*COUNT:capabilities=(\d+)\s*-->/,
    actual: countEngineCapabilities,
  },
  {
    doc: '95-api-reference-index.md',
    label: 'openapi operation count',
    marker: /<!--\s*COUNT:operations=(\d+)\s*-->/,
    actual: () => countOpenApiOperations()?.operations ?? null,
  },
  {
    doc: '95-api-reference-index.md',
    label: 'openapi path count',
    marker: /<!--\s*COUNT:paths=(\d+)\s*-->/,
    actual: () => countOpenApiOperations()?.paths ?? null,
  },
];

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function docFiles() {
  return readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();
}

/** Strip fenced code blocks so example snippets do not produce phantom path citations. */
function stripFences(text) {
  return text.replace(/^```[\s\S]*?^```/gm, m => m.replace(/[^\n]/g, ' '));
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const failures = [];
function fail(doc, line, check, message) {
  failures.push({ doc, line, check, message });
}

/* ------------------------------------------------------------------ *
 * Check 1 + 2: path and symbol citations
 * ------------------------------------------------------------------ */

const GLOBBY = /[*{}<>]/;

function resolveToken(token) {
  if (GENERATED_PATHS.has(token)) return null; // build/runtime artifact — not checked
  for (const { prefix, base } of PATH_ROOTS) {
    if (token.startsWith(prefix)) return join(base, token);
  }
  if (ROOT_FILES.has(token)) return join(OPENWA_ROOT, token);
  return null;
}

function checkCitations(doc, raw) {
  const text = stripFences(raw);
  const backticked = /`([^`\n]+)`/g;
  let m;
  while ((m = backticked.exec(text)) !== null) {
    const tokenRaw = m[1].trim();
    if (!tokenRaw || tokenRaw.includes(' ') || GLOBBY.test(tokenRaw)) continue;

    // `path.ts:Symbol` or `path.ts:Class.method`
    const symbolMatch = tokenRaw.match(/^(.+\.(?:ts|tsx|mjs|js|cjs|go|sh|yaml|yml|json)):([A-Za-z_$][\w$.]*)$/);
    const pathPart = symbolMatch ? symbolMatch[1] : tokenRaw;

    // Only treat as a path citation when it carries a known prefix or is a known root file.
    const abs = resolveToken(pathPart);
    if (!abs) continue;

    const line = lineOf(text, m.index);
    if (!existsSync(abs)) {
      fail(doc, line, 'PATHS', `unresolved path: ${pathPart}`);
      continue;
    }

    if (symbolMatch) {
      const symbol = symbolMatch[2];
      const leaf = symbol.split('.').pop();
      let body;
      try {
        body = readFileSync(abs, 'utf8');
      } catch {
        fail(doc, line, 'SYMBOLS', `cannot read ${pathPart} for symbol ${symbol}`);
        continue;
      }
      if (!new RegExp(`\\b${leaf.replace(/[$]/g, '\\$')}\\b`).test(body)) {
        fail(doc, line, 'SYMBOLS', `symbol '${symbol}' not found in ${pathPart}`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Check 3: cross-references between docs in this set
 * ------------------------------------------------------------------ */

/**
 * The set of documents 00-INDEX.md declares. Cross-references are validated against this
 * manifest rather than against files on disk, because the set is written incrementally and a
 * forward reference to a planned doc is correct — a reference to a doc nobody ever planned is
 * the actual error. checkIndexStatus separately keeps the manifest honest about what exists.
 */
function plannedDocs(docs) {
  const raw = docs.get('00-INDEX.md');
  const planned = new Set();
  if (raw === undefined) return planned;
  const row = /^\|\s*\[?`?((?:\d{2}|APPENDIX-[A-E])-[a-z0-9-]+\.md)`?\]?/gim;
  let m;
  while ((m = row.exec(raw)) !== null) planned.add(m[1]);
  return planned;
}

function checkXrefs(doc, raw, known, planned) {
  // 00-INDEX.md is the manifest itself.
  if (doc === '00-INDEX.md') return;
  const text = stripFences(raw);
  // OpenWA ships its own numbered docs under `docs/`, and this set cites them constantly. Those
  // are PATH citations, not cross-references into this set, so a `docs/`-prefixed match is skipped
  // here and validated by checkCitations instead. Without this the checker punishes the correct
  // behaviour (naming the upstream chapter) and pushes writers into fenced-block workarounds.
  const ref = /(docs\/)?\b((?:\d{2}|APPENDIX-[A-E])-[a-z0-9-]+\.md)\b/g;
  let m;
  while ((m = ref.exec(text)) !== null) {
    if (m[1]) continue; // `docs/NN-*.md` — an upstream path, handled as a path citation
    const target = m[2];
    if (!known.has(target) && !planned.has(target)) {
      fail(
        doc,
        lineOf(text, m.index),
        'XREF',
        `reference to a doc that is neither written nor planned in 00-INDEX.md: ${target}`,
      );
    }
  }
}

/* ------------------------------------------------------------------ *
 * Check 4 + 5: template conformance and portability label
 * ------------------------------------------------------------------ */

function checkTemplate(doc, raw) {
  if (TEMPLATE_EXEMPT.test(doc)) return;
  for (const heading of REQUIRED_HEADINGS) {
    if (!raw.includes(heading)) {
      fail(doc, 1, 'TEMPLATE', `missing required heading: ${heading}`);
    }
  }
  // The label may share the front-matter blockquote line with Band / Depends on.
  const declared = raw.match(/\*\*Jarcube class:\*\*\s*([A-Z-]+)/);
  if (!declared) {
    fail(doc, 1, 'CLASS', 'missing front-matter line: > **Jarcube class:** <LABEL>');
  } else if (!CLASS_LABELS.includes(declared[1])) {
    fail(doc, 1, 'CLASS', `invalid portability label '${declared[1]}' (expected one of ${CLASS_LABELS.join(', ')})`);
  }
}

/* ------------------------------------------------------------------ *
 * Check 3b: index status table honesty
 * ------------------------------------------------------------------ */

/**
 * Rows in 00-INDEX.md carry a status cell: `done` or `todo`. A row marked done must
 * resolve to a real file, and a file present in the set must not be marked todo — those
 * are the two ways the progress table can lie about itself.
 */
function checkIndexStatus(docs) {
  const raw = docs.get('00-INDEX.md');
  if (raw === undefined) return;
  const row = /^\|\s*\[?`?((?:\d{2}|APPENDIX-[A-E])-[a-z0-9-]+\.md)`?\]?[^|]*\|.*\|\s*(done|todo)\s*\|/gim;
  let m;
  while ((m = row.exec(raw)) !== null) {
    const [, target, status] = m;
    const exists = docs.has(target);
    const line = lineOf(raw, m.index);
    if (status.toLowerCase() === 'done' && !exists) {
      fail('00-INDEX.md', line, 'STATUS', `marked done but file missing: ${target}`);
    }
    if (status.toLowerCase() === 'todo' && exists) {
      fail('00-INDEX.md', line, 'STATUS', `file exists but still marked todo: ${target}`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Check 6: counted facts
 * ------------------------------------------------------------------ */

function checkCounts(docs) {
  for (const fact of COUNTED_FACTS) {
    const raw = docs.get(fact.doc);
    if (raw === undefined) continue; // doc not written yet
    const m = raw.match(fact.marker);
    if (!m) {
      fail(fact.doc, 1, 'COUNTS', `missing count marker for ${fact.label} (${fact.marker})`);
      continue;
    }
    const claimed = Number(m[1]);
    const actual = fact.actual();
    if (actual === null) continue;
    if (claimed !== actual) {
      fail(fact.doc, 1, 'COUNTS', `${fact.label}: doc claims ${claimed}, source has ${actual}`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Check 7: inventory completeness (Appendix E)
 * ------------------------------------------------------------------ */

const INVENTORY_ROOTS = ['src', 'dashboard/src', 'sdk'];

function checkInventory(docs) {
  const appendixE = docs.get('APPENDIX-E-file-atlas.md');
  if (appendixE === undefined) {
    if (STRICT) fail('APPENDIX-E-file-atlas.md', 1, 'INVENTORY', 'appendix not present (required under --strict)');
    return;
  }
  const all = [...docs.values()].join('\n');
  const missing = [];
  for (const root of INVENTORY_ROOTS) {
    const dir = join(OPENWA_ROOT, root);
    if (!existsSync(dir)) continue;
    for (const abs of walk(dir)) {
      const rel = relative(OPENWA_ROOT, abs);
      if (!/\.(ts|tsx|go|mjs)$/.test(rel)) continue;
      if (/\.spec\.|\.test\.|__mocks__|test-helpers/.test(rel)) continue;
      if (!all.includes(rel)) missing.push(rel);
    }
  }
  if (missing.length) {
    const shown = missing.slice(0, 25).join(', ');
    fail(
      'APPENDIX-E-file-atlas.md',
      1,
      'INVENTORY',
      `${missing.length} source file(s) never cited in any doc: ${shown}${missing.length > 25 ? ', …' : ''}`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

const names = docFiles();
if (names.length === 0) {
  console.log('verify-docs: no markdown files found — nothing to check.');
  process.exit(0);
}

const docs = new Map();
for (const name of names) docs.set(name, readFileSync(join(DOCS_DIR, name), 'utf8'));
const known = new Set(names);
const planned = plannedDocs(docs);

for (const [doc, raw] of docs) {
  // _TEMPLATE.md carries deliberate placeholder paths and forward references to appendices;
  // it is the shape being enforced, not an instance of it.
  if (doc === '_TEMPLATE.md') continue;
  checkCitations(doc, raw);
  checkXrefs(doc, raw, known, planned);
  checkTemplate(doc, raw);
}
checkIndexStatus(docs);
checkCounts(docs);
checkInventory(docs);

console.log(`verify-docs: scanned ${names.length} document(s) in ${relative(WORKSPACE_ROOT, DOCS_DIR)}`);

if (failures.length === 0) {
  console.log('verify-docs: OK — all checks passed.');
  process.exit(0);
}

const grouped = new Map();
for (const f of failures) {
  if (!grouped.has(f.doc)) grouped.set(f.doc, []);
  grouped.get(f.doc).push(f);
}

console.error(`\nverify-docs: ${failures.length} problem(s) found\n`);
for (const [doc, items] of [...grouped].sort()) {
  console.error(`  ${doc}`);
  for (const it of items.sort((a, b) => a.line - b.line)) {
    console.error(`    line ${it.line}  [${it.check}]  ${it.message}`);
  }
  console.error('');
}
process.exit(1);
