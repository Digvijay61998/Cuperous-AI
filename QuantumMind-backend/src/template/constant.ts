export const TEMPLATE_PROVIDER = 'TEMPLATE_MODEL';

// Upload limits
export const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50 MB compressed
export const MAX_EXTRACTED_SIZE = 100 * 1024 * 1024; // 100 MB extracted
export const MAX_SINGLE_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
export const MAX_FILE_COUNT = 500;

// Allowed asset extensions inside a template ZIP
export const ALLOWED_EXTENSIONS = [
  '.html',
  '.htm',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.map',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.bmp',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.mp4',
  '.webm',
  '.mp3',
  '.wav',
  '.ogg',
  '.lottie',
  '.xml',
  '.webmanifest',
  '.gltf'
];

// Disallowed extensions (defence-in-depth even if not in allow list)
export const DISALLOWED_EXTENSIONS = [
  '.exe',
  '.sh',
  '.bat',
  '.cmd',
  '.php',
  '.py',
  '.rb',
  '.pl',
  '.jar',
  '.dll',
  '.so',
  '.bin',
  '.com',
  '.msi',
  '.app',
];
