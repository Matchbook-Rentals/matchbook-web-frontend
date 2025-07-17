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
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    env: {
      NODE_ENV: 'test',
      TEST_DATABASE_URL: 'mysql://g7olyl869vsgp0xva5ak:pscale_pw_L3Y4YI9LvbMNYnQ3rwS30a7Kt70Kg7EbXNrtdssGKrq@aws.connect.psdb.cloud/matchbook-rentals-db?sslaccept=strict',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
