/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { routes } from './src/content/routes';

/**
 * Multi-page build.
 *
 * The shared `createTemplateConfig` factory in tooling/ is single-entry and
 * tuned for WebView bundles, so this site brings its own config. The important
 * differences:
 *
 *   - rollupOptions.input is generated from the route manifest, giving one
 *     emitted HTML document per route. A direct request to /partner returns
 *     partner HTML with a 200 — no SPA rewrite rule, and crawlers see real
 *     content on first response.
 *
 *   - base: './' is kept from the shared config so the build is hostable from
 *     a bucket root or a sub-path without rebuilding.
 */
export default defineConfig({
  base: './',
  plugins: [react()],

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2018',
    sourcemap: false,
    // Inline nothing — keeps hashed assets cacheable behind CloudFront.
    assetsInlineLimit: 0,
    rollupOptions: {
      input: Object.fromEntries(
        routes.map((r) => [r.entryName, resolve(__dirname, r.htmlPath)]),
      ),
    },
  },

  server: {
    port: 5400,
    host: true,
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
