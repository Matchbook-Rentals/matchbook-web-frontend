import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // environment: 'node', // Use jsdom for React hooks/components
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // By default, only run integration tests (not e2e tests - those run with Playwright)
    include: ['test/integration/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
