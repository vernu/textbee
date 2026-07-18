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
    // Total SMS sent stat from the mocked gateway stats fixture (12,840).
    await expect(page.getByText('12,840')).toBeVisible()
    // Onboarding card shows its progress bar (all 6 steps done in fixtures).
    await expect(
      page.getByRole('progressbar', { name: 'Setup progress' })
    ).toBeVisible()
    await expect(page.getByText('6 of 6')).toBeVisible()
    // Webhooks summary row keeps a mobile path to /dashboard/webhooks
    // (fixtures have 1 active webhook).
    await expect(
      page.getByRole('link', { name: /active webhook/ })
    ).toBeVisible()
  })

  test('leads with real quota usage, not invented trends', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    // Daily and monthly windows straight from the subscription fixture:
    // 320 of 5,000 today, 18,450 of 100,000 this month.
    await expect(
      page.getByRole('progressbar', { name: 'Today usage' })
    ).toBeVisible()
    await expect(
      page.getByRole('progressbar', { name: 'This month usage' })
    ).toBeVisible()
    await expect(page.getByText('/ 5,000')).toBeVisible()
    await expect(page.getByText('4,680 remaining')).toBeVisible()

    // The old page decorated every stat with a green trend arrow and captioned
    // all-time totals "Since last year". Nothing computed either.
    await expect(page.getByText('Since last year')).toHaveCount(0)
    await expect(page.getByText('Connected now')).toHaveCount(0)
  })

  test('shows recent messages for the connected device', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    const activity = page
      .locator('div')
      .filter({ hasText: /^Recent activity/ })
      .first()
    await expect(activity).toBeVisible()

    // Mocked message body and its recipient.
    await expect(page.getByText('Hello from textbee')).toBeVisible()
    await expect(
      page.getByRole('link', { name: /view all/i })
    ).toHaveAttribute('href', '/dashboard/messaging/history')
  })
})
