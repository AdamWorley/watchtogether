import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' } })],
        test: {
          name: 'worker',
          include: ['test/worker/**/*.test.ts'],
        },
      },
    ],
    coverage: {
      provider: 'istanbul',
      include: ['src/shared/**/*.ts', 'src/worker/**/*.ts'],
      exclude: ['src/worker/worker-configuration.d.ts'],
      reporter: ['text-summary', 'lcov'],
    },
  },
});
