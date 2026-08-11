/// <reference types="vitest" />
import { createTemplateConfig } from '../../tooling/vite.config.shared';

export default createTemplateConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
} as any);
