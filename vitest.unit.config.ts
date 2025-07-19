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
    // Only run unit tests (exclude integration tests)
    include: [
      'test/components/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'test/lib/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'test/hooks/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'test/server-actions/**/*.{test,spec}.{js,ts,jsx,tsx}', // server action unit tests
      'src/hooks/**/*.test.{js,ts,jsx,tsx}', // unit tests in src/hooks
      'src/components/**/*.test.{js,ts,jsx,tsx}', // unit tests in src/components
      'src/lib/**/*.test.{js,ts,jsx,tsx}', // unit tests in src/lib
    ],
    exclude: [
      'test/integration/**/*',
      'e2e/**/*',
      '**/*.integration.test.{js,ts,jsx,tsx}',
    ],
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