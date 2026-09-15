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

export type TemplateConfigType =
  | 'text'
  | 'richtext'
  | 'image'
  | 'color'
  | 'number'
  | 'currency'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'date'
  | 'time'
  | 'url'
  | 'list';

export interface TemplateConfigSchemaField {
  key: string;
  type: TemplateConfigType | string;
  label?: string;
  defaultValue?: any;
  group?: string;
  options?: string[];
  helpText?: string;
  required?: boolean;
  /** Numeric bounds for `number` / `currency`. */
  min?: number;
  max?: number;
  /** Character cap for the string-backed types. */
  maxLength?: number;
  /** Row cap for `list`. */
  maxItems?: number;
  /** Per-row field definitions for `list` (repeater) fields. */
  itemSchema?: TemplateConfigSchemaField[];
}

// Hard caps so a compromised or careless admin can't store an unbounded
// document (Mongo refuses >16MB and huge configs slow every template load).
export const MAX_LIST_ITEMS = 200;
export const MAX_TEXT_LENGTH = 5_000;
export const MAX_RICHTEXT_LENGTH = 20_000;

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
/**
 * Maps one raw manifest field onto the stored schema shape, keeping only the
 * properties we understand. `nested` blocks a manifest from declaring a list
 * inside a list, which the dashboard has no UI for.
 */
const normalizeSchemaField = (f: any, nested = false): any => {
  const type = f.type || 'text';
  const field: any = {
    key: f.key,
    type: nested && type === 'list' ? 'text' : type,
    label: f.label || f.key,
    defaultValue: f.defaultValue ?? (type === 'list' ? [] : ''),
    group: f.group || 'General',
    options: Array.isArray(f.options) ? f.options : [],
    helpText: typeof f.helpText === 'string' ? f.helpText : '',
    required: f.required === true,
  };

  if (typeof f.min === 'number') field.min = f.min;
  if (typeof f.max === 'number') field.max = f.max;
  if (typeof f.maxLength === 'number') field.maxLength = f.maxLength;

  if (!nested && type === 'list') {
    field.maxItems =
      typeof f.maxItems === 'number'
        ? Math.min(f.maxItems, MAX_LIST_ITEMS)
        : MAX_LIST_ITEMS;
    field.itemSchema = Array.isArray(f.itemSchema)
      ? f.itemSchema
          .filter((i: any) => i && typeof i.key === 'string')
          .map((i: any) => normalizeSchemaField(i, true))
      : [];
  }

  return field;
};

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
    .map((f: any) => normalizeSchemaField(f));

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

const normalizeBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  }
  throw new HttpException(
    'Expected a boolean value',
    HttpStatus.BAD_REQUEST,
  );
};

const normalizeNumber = (value: any): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new HttpException(
    'Expected a valid number',
    HttpStatus.BAD_REQUEST,
  );
};

const normalizeColor = (value: any): string => {
  if (typeof value !== 'string') {
    throw new HttpException(
      'Expected a color hex string',
      HttpStatus.BAD_REQUEST,
    );
  }
  const normalized = value.trim();
  if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(normalized)) {
    throw new HttpException(
      'Expected color in #RGB or #RRGGBB format',
      HttpStatus.BAD_REQUEST,
    );
  }
  return normalized;
};

/**
 * Config values are rendered inside the visitor-facing template, so any
 * string that ends up in an `href`/`src` must not carry an executable scheme.
 */
const DANGEROUS_URL_SCHEME = /^\s*(javascript|data|vbscript):/i;

const normalizeUrlLike = (value: any, what: string): string => {
  if (typeof value !== 'string') {
    throw new HttpException(`Expected a ${what}`, HttpStatus.BAD_REQUEST);
  }
  const normalized = value.trim();
  if (normalized === '') return '';
  if (DANGEROUS_URL_SCHEME.test(normalized)) {
    throw new HttpException(
      'URL scheme is not allowed',
      HttpStatus.BAD_REQUEST,
    );
  }
  return normalized;
};

const normalizeDate = (value: any): string => {
  if (typeof value !== 'string') {
    throw new HttpException('Expected a date string', HttpStatus.BAD_REQUEST);
  }
  const normalized = value.trim();
  if (normalized === '') return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new HttpException(
      'Expected date in YYYY-MM-DD format',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (Number.isNaN(Date.parse(normalized))) {
    throw new HttpException('Expected a real calendar date', HttpStatus.BAD_REQUEST);
  }
  return normalized;
};

const normalizeTime = (value: any): string => {
  if (typeof value !== 'string') {
    throw new HttpException('Expected a time string', HttpStatus.BAD_REQUEST);
  }
  const normalized = value.trim();
  if (normalized === '') return '';
  // Accepts both 24-hour (14:30) and 12-hour (02:30 PM) clock strings.
  if (!/^([01]?\d|2[0-3]):[0-5]\d(\s?[AaPp][Mm])?$/.test(normalized)) {
    throw new HttpException(
      'Expected time like 14:30 or 02:30 PM',
      HttpStatus.BAD_REQUEST,
    );
  }
  return normalized;
};

const normalizeCurrency = (value: any): number => {
  const amount = normalizeNumber(value);
  if (amount < 0) {
    throw new HttpException('Expected a non-negative amount', HttpStatus.BAD_REQUEST);
  }
  // Money is stored to 2dp so totals rendered by templates stay consistent.
  return Math.round(amount * 100) / 100;
};

/**
 * Rich text is admin-authored HTML. Rather than silently stripping markup
 * (which gives a false sense of safety), reject anything executable outright.
 */
const RICHTEXT_BLOCKLIST = [
  /<\s*script/i,
  /<\s*iframe/i,
  /<\s*object/i,
  /<\s*embed/i,
  /\son[a-z]+\s*=/i,
  DANGEROUS_URL_SCHEME,
];

const normalizeRichText = (value: any): string => {
  if (typeof value !== 'string') {
    throw new HttpException('Expected a string', HttpStatus.BAD_REQUEST);
  }
  for (const pattern of RICHTEXT_BLOCKLIST) {
    if (pattern.test(value)) {
      throw new HttpException(
        'Scripts, embedded frames and inline event handlers are not allowed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  return value;
};

const normalizeMultiSelect = (
  value: any,
  options: string[],
): string[] => {
  if (!Array.isArray(value)) {
    throw new HttpException('Expected a list of options', HttpStatus.BAD_REQUEST);
  }
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string') {
      throw new HttpException('Expected option values to be strings', HttpStatus.BAD_REQUEST);
    }
    if (options.length > 0 && !options.includes(entry)) {
      throw new HttpException(
        `Invalid option '${entry}'. Allowed: ${options.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    seen.add(entry);
  }
  return [...seen];
};

/**
 * Runs a primitive normalizer and, on failure, rethrows with the field's
 * label/key attached so the dashboard can point the user at the exact field
 * that failed (the primitive normalizers only know the value, not the field).
 */
const withFieldContext = <T>(
  field: TemplateConfigSchemaField,
  fn: () => T,
): T => {
  try {
    return fn();
  } catch (error) {
    const label = field.label || field.key;
    throw new HttpException(
      `Invalid value for '${label}': ${error?.message || 'validation failed'}`,
      HttpStatus.BAD_REQUEST,
    );
  }
};

const isBlank = (value: any): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

/** Applies the declarative min/max/maxLength constraints from the schema. */
const applyConstraints = (
  field: TemplateConfigSchemaField,
  value: any,
): any => {
  if (typeof value === 'number') {
    if (typeof field.min === 'number' && value < field.min) {
      throw new HttpException(
        `Must be at least ${field.min}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (typeof field.max === 'number' && value > field.max) {
      throw new HttpException(
        `Must be at most ${field.max}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  if (typeof value === 'string') {
    const type = field.type || 'text';
    const hardCap =
      type === 'richtext' ? MAX_RICHTEXT_LENGTH : MAX_TEXT_LENGTH;
    const limit =
      typeof field.maxLength === 'number'
        ? Math.min(field.maxLength, hardCap)
        : hardCap;
    if (value.length > limit) {
      throw new HttpException(
        `Must be ${limit} characters or fewer`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  return value;
};

/**
 * Normalizes the rows of a `list` (repeater) field against its `itemSchema`.
 * Nesting is intentionally limited to one level - a list inside a list has no
 * dashboard UI and would allow unbounded document growth.
 */
const normalizeList = (
  field: TemplateConfigSchemaField,
  value: any,
): any[] => {
  if (!Array.isArray(value)) {
    throw new HttpException(
      `Expected a list for '${field.label || field.key}'`,
      HttpStatus.BAD_REQUEST,
    );
  }

  const maxItems = Math.min(
    typeof field.maxItems === 'number' ? field.maxItems : MAX_LIST_ITEMS,
    MAX_LIST_ITEMS,
  );
  if (value.length > maxItems) {
    throw new HttpException(
      `'${field.label || field.key}' allows at most ${maxItems} items`,
      HttpStatus.BAD_REQUEST,
    );
  }

  const itemSchema = Array.isArray(field.itemSchema) ? field.itemSchema : [];
  if (itemSchema.length === 0) {
    // No row definition declared - store the rows as-is (forward compatible).
    return value;
  }

  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new HttpException(
        `'${field.label || field.key}' item ${index + 1} must be an object`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const row: Record<string, any> = {};
    for (const itemField of itemSchema) {
      if (!itemField?.key) continue;
      if (itemField.type === 'list') {
        throw new HttpException(
          `Nested lists are not supported ('${field.key}' → '${itemField.key}')`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const raw = item[itemField.key];
      if (raw === undefined) {
        if (itemField.required) {
          throw new HttpException(
            `'${field.label || field.key}' item ${index + 1}: '${
              itemField.label || itemField.key
            }' is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        continue;
      }

      try {
        row[itemField.key] = normalizeByType(itemField, raw);
      } catch (error) {
        throw new HttpException(
          `'${field.label || field.key}' item ${index + 1}: ${
            error?.message || 'validation failed'
          }`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return row;
  });
};

const normalizeByType = (
  field: TemplateConfigSchemaField,
  value: any,
): any => {
  const type = (field.type || 'text') as TemplateConfigType;

  if (field.required && isBlank(value)) {
    throw new HttpException(
      `'${field.label || field.key}' is required`,
      HttpStatus.BAD_REQUEST,
    );
  }

  switch (type) {
    case 'boolean':
      return withFieldContext(field, () => normalizeBoolean(value));
    case 'number':
      return withFieldContext(field, () =>
        applyConstraints(field, normalizeNumber(value)),
      );
    case 'currency':
      return withFieldContext(field, () =>
        applyConstraints(field, normalizeCurrency(value)),
      );
    case 'color':
      return withFieldContext(field, () => normalizeColor(value));
    case 'date':
      return withFieldContext(field, () => normalizeDate(value));
    case 'time':
      return withFieldContext(field, () => normalizeTime(value));
    case 'url':
      return withFieldContext(field, () =>
        applyConstraints(field, normalizeUrlLike(value, 'URL')),
      );
    case 'richtext':
      return withFieldContext(field, () =>
        applyConstraints(field, normalizeRichText(value)),
      );
    case 'multiselect':
      return withFieldContext(field, () =>
        normalizeMultiSelect(value, Array.isArray(field.options) ? field.options : []),
      );
    case 'list':
      return normalizeList(field, value);
    case 'select': {
      if (typeof value !== 'string') {
        throw new HttpException(
          `Expected a string for '${field.key}'`,
          HttpStatus.BAD_REQUEST,
        );
      }
      const options = Array.isArray(field.options) ? field.options : [];
      if (options.length > 0 && !options.includes(value)) {
        throw new HttpException(
          `Invalid option for '${field.key}'. Allowed: ${options.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      return value;
    }
    case 'image':
      return withFieldContext(field, () =>
        applyConstraints(field, normalizeUrlLike(value, 'image URL')),
      );
    case 'text':
      if (typeof value !== 'string') {
        throw new HttpException(
          `Expected a string for '${field.key}'`,
          HttpStatus.BAD_REQUEST,
        );
      }
      return withFieldContext(field, () => applyConstraints(field, value));
    default:
      // Forward compatibility: unknown field types are accepted as-is.
      return value;
  }
};

/**
 * Validates and normalizes config overrides against a template manifest schema.
 */
export const validateAndNormalizeConfigValues = (
  schema: TemplateConfigSchemaField[] = [],
  updates: Record<string, any> = {},
): Record<string, any> => {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw new HttpException('configValues must be an object', HttpStatus.BAD_REQUEST);
  }

  if (!Array.isArray(schema) || schema.length === 0) {
    // Legacy templates with no schema keep previous permissive behavior.
    return { ...updates };
  }

  const byKey = new Map<string, TemplateConfigSchemaField>();
  for (const field of schema) {
    if (field?.key) byKey.set(field.key, field);
  }

  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    const field = byKey.get(key);
    if (!field) {
      throw new HttpException(
        `Unknown config key '${key}'`,
        HttpStatus.BAD_REQUEST,
      );
    }
    normalized[key] = normalizeByType(field, value);
  }

  return normalized;
};
