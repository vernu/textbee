import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

// Serverless-cost regression guard. The API client's token is seeded from the
// server-fetched session, so browsing the dashboard must not keep calling
// /api/auth/session. Before this guard, the axios interceptor refetched the
// session every 2 minutes with no dedupe, so a burst of queries fanned out
// one session call each.
test('dashboard navigation makes at most one /api/auth/session call', async ({
  page,
  context,
}) => {
  await authenticate(context)
  await mockApi(page)

  let sessionCalls = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/auth/session') {
      sessionCalls += 1
    }
  })

  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Welcome back, Test', level: 2 })
  ).toBeVisible()

  const mainNav = page.getByRole('navigation', { name: 'Main' })
  const tabs = page.getByRole('navigation', { name: 'Section navigation' })

  await mainNav.getByRole('link', { name: 'Messaging' }).click()
  await expect(page).toHaveURL(/\/dashboard\/messaging$/)
  await tabs.getByRole('link', { name: 'History' }).click()
  await expect(page).toHaveURL(/\/dashboard\/messaging\/history$/)

  await mainNav.getByRole('link', { name: 'Webhooks' }).click()
  await expect(page).toHaveURL(/\/dashboard\/webhooks$/)
  await tabs.getByRole('link', { name: 'Deliveries' }).click()
  await expect(page).toHaveURL(/\/dashboard\/webhooks\/deliveries$/)

  await mainNav.getByRole('link', { name: 'Account' }).click()
  await expect(page).toHaveURL(/\/dashboard\/account\/billing$/)

  expect(sessionCalls).toBeLessThanOrEqual(1)
})
