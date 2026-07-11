import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

test.describe('dashboard (mocked API, no real backend)', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await mockApi(page)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects authenticated users away from login', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('renders the dashboard with mocked data for an authenticated user', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)

    await page.goto('/dashboard')

    await expect(
      page.getByRole('heading', { name: 'Welcome back, Test', level: 2 })
    ).toBeVisible()
    // Quick actions row.
    await expect(page.getByRole('link', { name: 'Send SMS' })).toBeVisible()
    // Total SMS Sent stat from the mocked gateway stats fixture (12,840).
    await expect(page.getByText('12,840')).toBeVisible()
    // Onboarding card shows its progress bar (all 6 steps done in fixtures).
    await expect(page.getByRole('progressbar')).toBeVisible()
    await expect(page.getByText('6 of 6')).toBeVisible()
    // Webhooks summary row keeps a mobile path to /dashboard/webhooks
    // (fixtures have 1 active webhook).
    await expect(
      page.getByRole('link', { name: /active webhook/ })
    ).toBeVisible()
  })
})
