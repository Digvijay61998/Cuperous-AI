import { HttpException, HttpStatus } from '@nestjs/common';
import AdmZip from 'adm-zip';
import * as path from 'path';
import {
  ALLOWED_EXTENSIONS,
  DISALLOWED_EXTENSIONS,
  MAX_EXTRACTED_SIZE,
  MAX_FILE_COUNT,
  MAX_SINGLE_FILE_SIZE,
  MAX_ZIP_SIZE,
} from './constant';

export interface ValidatedEntry {
  /** Normalised path relative to the template root (index.html at root). */
  entryPath: string;
  data: Buffer;
  size: number;
}

export interface ValidatedZip {
  entries: ValidatedEntry[];
  totalSize: number;
  fileCount: number;
  manifest: Record<string, any> | null;
}

/**
 * Detects a single common top-level folder (e.g. a `dist/` wrapper) so that
 * the template is always rooted where `index.html` lives.
 */
const detectRootPrefix = (paths: string[]): string => {
  const topLevelDirs = new Set<string>();
  let hasRootIndex = false;

  for (const p of paths) {
    const segments = p.split('/');
    if (segments.length === 1) {
      if (segments[0].toLowerCase() === 'index.html') hasRootIndex = true;
    } else {
      topLevelDirs.add(segments[0]);
    }
  }

  // index.html already at the archive root -> no prefix to strip.
  if (hasRootIndex) return '';

  // Everything lives under a single wrapper folder -> strip it.
  if (topLevelDirs.size === 1) {
    return `${[...topLevelDirs][0]}/`;
  }

  return '';
};

const isUnsafePath = (entryPath: string): boolean => {
  if (!entryPath) return true;
  // Reject absolute paths, traversal and null bytes.
  if (entryPath.includes('..')) return true;
  if (entryPath.startsWith('/') || entryPath.startsWith('\\')) return true;
  if (entryPath.includes('\0')) return true;
  if (path.isAbsolute(entryPath)) return true;
  return false;
};

/**
 * Validates an uploaded template ZIP and returns the normalised set of files
 * ready to be pushed to storage. Throws HttpException (400) on any violation.
 */
export const validateTemplateZip = (file: {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
}): ValidatedZip => {
  if (!file || !file.buffer) {
    throw new HttpException('Template ZIP file is required', HttpStatus.BAD_REQUEST);
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext !== '.zip') {
    throw new HttpException(
      'Only .zip files are accepted for template upload',
      HttpStatus.BAD_REQUEST,
    );
  }

  if (file.size > MAX_ZIP_SIZE) {
    throw new HttpException(
      `Template ZIP exceeds the ${Math.round(MAX_ZIP_SIZE / (1024 * 1024))}MB limit`,
      HttpStatus.PAYLOAD_TOO_LARGE,
    );
  }

  let zip: AdmZip;
  try {
    zip = new AdmZip(file.buffer);
  } catch (e) {
    throw new HttpException('Uploaded file is not a valid ZIP archive', HttpStatus.BAD_REQUEST);
  }

  const rawEntries = zip.getEntries().filter((entry) => !entry.isDirectory);

  if (rawEntries.length === 0) {
    throw new HttpException('Template ZIP is empty', HttpStatus.BAD_REQUEST);
  }

  if (rawEntries.length > MAX_FILE_COUNT) {
    throw new HttpException(
      `Template exceeds the maximum of ${MAX_FILE_COUNT} files`,
      HttpStatus.BAD_REQUEST,
    );
  }

  const normalisedPaths = rawEntries.map((e) => e.entryName.replace(/\\/g, '/'));
  const rootPrefix = detectRootPrefix(normalisedPaths);

  const entries: ValidatedEntry[] = [];
  let totalSize = 0;
  let hasIndex = false;
  let manifest: Record<string, any> | null = null;

  for (const entry of rawEntries) {
    const normalised = entry.entryName.replace(/\\/g, '/');

    // Skip OS/editor noise.
    if (
      normalised.startsWith('__MACOSX/') ||
      normalised.split('/').some((seg) => seg === '.DS_Store' || seg === 'Thumbs.db')
    ) {
      continue;
    }

    const entryPath = rootPrefix && normalised.startsWith(rootPrefix)
      ? normalised.slice(rootPrefix.length)
      : normalised;

    if (isUnsafePath(entryPath)) {
      throw new HttpException(
        `Unsafe file path detected in ZIP: ${normalised}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const fileExt = path.extname(entryPath).toLowerCase();

    if (DISALLOWED_EXTENSIONS.includes(fileExt)) {
      throw new HttpException(
        `Disallowed file type in template: ${fileExt}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (fileExt && !ALLOWED_EXTENSIONS.includes(fileExt)) {
      throw new HttpException(
        `File type not permitted in template: ${fileExt} (${entryPath})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = entry.getData();

    if (data.length > MAX_SINGLE_FILE_SIZE) {
      throw new HttpException(
        `File ${entryPath} exceeds the ${Math.round(
          MAX_SINGLE_FILE_SIZE / (1024 * 1024),
        )}MB per-file limit`,
        HttpStatus.BAD_REQUEST,
      );
    }

    totalSize += data.length;
    if (totalSize > MAX_EXTRACTED_SIZE) {
      throw new HttpException(
        `Extracted template exceeds the ${Math.round(
          MAX_EXTRACTED_SIZE / (1024 * 1024),
        )}MB limit (possible ZIP bomb)`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (entryPath.toLowerCase() === 'index.html') {
      hasIndex = true;
    }

    if (entryPath.toLowerCase() === 'manifest.json') {
      try {
        manifest = JSON.parse(data.toString('utf-8'));
      } catch {
        // A malformed manifest is non-fatal; config schema simply won't load.
        manifest = null;
      }
    }

    entries.push({ entryPath, data, size: data.length });
  }

  if (!hasIndex) {
    throw new HttpException(
      'Template ZIP must contain an index.html at its root',
      HttpStatus.BAD_REQUEST,
    );
  }

  return { entries, totalSize, fileCount: entries.length, manifest };
};

/**
 * Makes a production build (CRA / Vite / webpack) hostable from a sub-path by
 * converting root-absolute asset references into relative ones.
 *
 * Builds default to referencing assets from the domain root:
 *   <script src="/static/js/main.js">   and   webpackPublicPath = "/"
 * which 404 when served from /api/file/templates/{id}/v{version}/index.html.
 * After rewriting, assets resolve relative to the template folder, so the
 * same build works from any host / sub-path without a rebuild. Templates
 * built with `base: './'` (our recommended contract) already emit relative
 * paths, so this is a no-op safety net for those and a real fix for anything
 * built the default (root-absolute) way.
 */
export const rewriteHtmlForSubPath = (html: string): string => {
  let out = html;

  // 1. Neutralise webpack publicPath: X.p="/" -> X.p="./"
  out = out.replace(/([A-Za-z_$][\w$]*)\.p\s*=\s*"\/"/g, '$1.p="./"');
  out = out.replace(/([A-Za-z_$][\w$]*)\.p\s*=\s*'\/'/g, "$1.p='./'");

  // 2. Strip a single leading slash from local src/href so they become
  //    relative to the document. Protocol-relative (//) is skipped via the
  //    negative lookahead; absolute URLs (http...) never match this pattern.
  out = out.replace(/\b(src|href)=("|')\/(?!\/)/g, '$1=$2./');

  return out;
};

/**
 * Applies the sub-path rewrite to every .html file in the validated entry
 * set, returning a new entry array (buffers replaced for html files only).
 */
export const makeEntriesPortable = (
  entries: ValidatedEntry[],
): ValidatedEntry[] => {
  return entries.map((entry) => {
    const ext = path.extname(entry.entryPath).toLowerCase();
    if (ext === '.html' || ext === '.htm') {
      const rewritten = rewriteHtmlForSubPath(entry.data.toString('utf-8'));
      const data = Buffer.from(rewritten, 'utf-8');
      return { ...entry, data, size: data.length };
    }
    return entry;
  });
};

/**
 * Extracts the `templateConfig` declaration from a parsed manifest.json.
 * Expected shape: { templateConfig: [{ key, type, label, defaultValue, group, options }] }
 */
export const extractConfigSchema = (
  manifest: Record<string, any> | null,
): {
  configSchema: any[];
  configValues: Record<string, any>;
  meta: Record<string, any>;
} => {
  const empty = { configSchema: [], configValues: {}, meta: {} };
  if (!manifest) return empty;

  const rawSchema = Array.isArray(manifest.templateConfig)
    ? manifest.templateConfig
    : Array.isArray(manifest.config)
    ? manifest.config
    : [];

  const configSchema = rawSchema
    .filter((f: any) => f && typeof f.key === 'string')
    .map((f: any) => ({
      key: f.key,
      type: f.type || 'text',
      label: f.label || f.key,
      defaultValue: f.defaultValue ?? '',
      group: f.group || 'General',
      options: Array.isArray(f.options) ? f.options : [],
    }));

  const configValues: Record<string, any> = {};
  for (const field of configSchema) {
    configValues[field.key] = field.defaultValue;
  }

  const meta: Record<string, any> = {};
  if (Array.isArray(manifest.supportedLanguages)) {
    meta.supportedLanguages = manifest.supportedLanguages;
  }
  if (typeof manifest.supportsDarkMode === 'boolean') {
    meta.supportsDarkMode = manifest.supportsDarkMode;
  }
  if (typeof manifest.estimatedDuration === 'string') {
    meta.estimatedDuration = manifest.estimatedDuration;
  }

  return { configSchema, configValues, meta };
};
