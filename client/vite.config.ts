import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Local API (server/ workspace). In dev and preview the client calls relative
// `/api/...` URLs and Vite forwards them, so there is no CORS setup to keep in sync.
const API_DEV_TARGET = 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Reads the `@/*` alias from tsconfig.app.json, so it is declared in one place.
    tsconfigPaths: true,
  },
  server: {
    port: 5173,
    // Fail loudly instead of hopping to another port: the API allows this origin.
    strictPort: true,
    proxy: {
      '/api': { target: API_DEV_TARGET, changeOrigin: true },
    },
  },
  // `preview.proxy` defaults to `server.proxy`, so `npm run preview` talks to the API too.
  preview: {
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Components are tested by behavior, not styles; skipping CSS keeps runs fast.
    css: false,
    // Pin the API base so a developer's .env.local cannot change test expectations.
    env: { VITE_API_URL: '/api/v1' },
    restoreMocks: true,
    unstubGlobals: true,
  },
});
