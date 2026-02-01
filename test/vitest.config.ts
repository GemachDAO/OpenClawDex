import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: path.resolve(__dirname),
    include: [
      'api/**/*.test.ts',
      'services/**/*.test.ts',
      'middleware/**/*.test.ts',
    ],
    exclude: ['e2e/**/*', 'node_modules/**/*'],
    setupFiles: ['./setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        '../apps/api/src/**/*.ts',
      ],
      exclude: [
        '../apps/api/src/index.ts',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/node_modules/**',
      ],
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    reporters: ['verbose'],
    sequence: {
      shuffle: false,
    },
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, '../apps/api/src'),
      '@fixtures': path.resolve(__dirname, './fixtures'),
      '@mocks': path.resolve(__dirname, './mocks'),
      '@utils': path.resolve(__dirname, './utils'),
    },
  },
});
