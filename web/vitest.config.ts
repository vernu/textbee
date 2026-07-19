import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the tsconfig "@/*" -> "./*" path alias.
    alias: { '@': path.resolve(__dirname, './') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // Unit/component tests only. Playwright specs live in ./e2e and run separately.
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e', 'test-results', 'playwright-report'],
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3001/api/v1',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/**', 'components/**', 'lib/**', 'hooks/**'],
      exclude: ['**/*.d.ts', 'test/**', 'e2e/**'],
    },
  },
})
