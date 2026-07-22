import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './msw/server'

// The axios browser client's interceptor falls back to next-auth's
// getSession() when no token has been seeded (tests render components without
// the app's Providers), which would otherwise trigger a real /api/auth/session
// fetch. Mock it so the interceptor can attach the Bearer token without any
// network access.
const hoisted = vi.hoisted(() => ({ accessToken: 'test-access-token' }))
vi.mock('next-auth/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth/react')>()
  return {
    ...actual,
    getSession: async () => ({
      user: {
        id: 'user_test_1',
        name: 'Test User',
        email: 'test.user@example.com',
        accessToken: hoisted.accessToken,
      },
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }),
  }
})

// Fail loudly on any request that is not explicitly mocked. This guarantees a
// test can never silently fall through to a real backend.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// jsdom lacks these browser APIs that Radix UI / next-themes rely on.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver || (ResizeObserverMock as any)

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
}
