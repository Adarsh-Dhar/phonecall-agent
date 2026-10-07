import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // DB tests share one Postgres; run files one at a time.
    fileParallelism: false,
  },
});
