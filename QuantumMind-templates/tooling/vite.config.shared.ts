import react from '@vitejs/plugin-react';
import { defineConfig, UserConfig } from 'vite';

/**
 * Shared Vite config factory for every template.
 *
 * The critical bit is `base: './'` which makes the build reference its assets
 * relatively, so the bundle is hostable from any sub-path
 * (e.g. /api/file/templates/{id}/v{version}/) without a rebuild.
 */
export const createTemplateConfig = (overrides: UserConfig = {}): UserConfig =>
  defineConfig({
    base: './',
    plugins: [react()],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // Keep the bundle lean for fast WebView loads.
      target: 'es2018',
      sourcemap: false,
    },
    server: {
      port: 5300,
      host: true,
    },
    ...overrides,
  }) as UserConfig;

export default createTemplateConfig;
