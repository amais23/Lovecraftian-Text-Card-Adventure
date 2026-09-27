import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('journey_summary')) {
            return 'journey-summary-data';
          }
          if (id.includes('balance_summary_data')) {
            return 'balance-summary-data';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Node built-ins (fs, path) are used in CSS-seam tests (CustomCursorHelp.test.tsx).
    // Keep "node" types scoped to the test runner — NOT in tsconfig.app.json — so
    // frontend source code doesn't accidentally gain access to Node globals.
    environmentOptions: {},
    typecheck: {
      tsconfig: './tsconfig.node.json',
    },
  },
})
