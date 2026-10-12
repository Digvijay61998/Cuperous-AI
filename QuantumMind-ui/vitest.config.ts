import path from 'path';
import { defineConfig } from 'vitest/config';

// Unit tests for pure logic only (no DOM, no Next runtime).
export default defineConfig({
  resolve: {
    alias: { src: path.resolve(__dirname, 'src') },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
