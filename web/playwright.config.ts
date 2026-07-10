import { defineConfig, devices } from '@playwright/test'

// E2e runs the real Next app but every backend call is intercepted with mocked
// fixtures (see e2e/mock-api.ts). No real backend is ever contacted. The dev
// server is started with a fixed test secret so we can mint a valid NextAuth
// session cookie in tests.
export const TEST_AUTH_SECRET = 'e2e-test-secret-do-not-use-in-prod'
const PORT = 3100
export const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      NEXTAUTH_URL: BASE_URL,
      NEXTAUTH_SECRET: TEST_AUTH_SECRET,
      // Point the app at a backend host that only exists to be intercepted.
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3999/api/v1',
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'e2e-google-client-id',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    },
  },
})
