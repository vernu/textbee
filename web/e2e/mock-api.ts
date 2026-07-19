import type { Page, Route } from '@playwright/test'
import {
  mockApiKeys,
  mockBillingPlans,
  mockDevices,
  mockMessages,
  mockStats,
  mockSubscription,
  mockUser,
  mockWebhookNotifications,
  mockWebhooks,
} from '../test/fixtures'

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

// Intercept EVERY call to the backend (`/api/v1/**`) and serve fixtures. Because
// the app is pointed at a backend host that nothing listens on, this guarantees
// no request ever reaches a real backend during e2e.
export type MockApiOverrides = {
  /** Serve a different subscription payload, e.g. the free-user shape. */
  subscription?: unknown
}

export async function mockApi(page: Page, overrides: MockApiOverrides = {}) {
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')

    if (path === '/auth/who-am-i') return json(route, { data: mockUser })
    if (path === '/billing/current-subscription')
      return json(route, overrides.subscription ?? mockSubscription)
    if (path === '/billing/plans') return json(route, { data: mockBillingPlans })
    if (path === '/gateway/devices') return json(route, { data: mockDevices })
    if (path === '/gateway/stats') return json(route, { data: mockStats })
    if (path === '/webhooks') return json(route, { data: mockWebhooks })
    if (path === '/webhooks/notifications')
      return json(route, mockWebhookNotifications)
    if (path === '/auth/api-keys') return json(route, { data: mockApiKeys })
    if (/\/gateway\/devices\/[^/]+\/(messages|get-received-sms)/.test(path))
      return json(route, mockMessages)

    // Any unmapped backend call still gets a benign mocked response so the test
    // cannot fall through to a real backend.
    return json(route, { data: [] })
  })
}
