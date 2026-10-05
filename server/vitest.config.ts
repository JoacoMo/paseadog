import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Set explicitly so tests never depend on the shell or a local .env file.
    env: { NODE_ENV: 'test' },
  },
});
