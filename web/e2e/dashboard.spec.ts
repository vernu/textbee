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

  // "Add device" used to open the API key modal directly from the header,
  // handing a first-time user a key with no mention of installing the app or
  // granting SMS permissions. Both entry points now share one flow.
  for (const entry of [
    { name: 'header quick action', nth: 0 },
    { name: 'devices card', nth: 1 },
  ]) {
    test(`add device from the ${entry.name} explains the steps first`, async ({
      page,
      context,
    }) => {
      await authenticate(context)
      await mockApi(page)
      await page.goto('/dashboard')

      await page
        .getByRole('button', { name: 'Add device' })
        .nth(entry.nth)
        .click()

      const dialog = page.getByRole('dialog')
      await expect(
        dialog.getByRole('heading', { name: 'Add a device' })
      ).toBeVisible()
      // The prerequisites a key modal never mentioned.
      await expect(dialog.getByText(/grant SMS permissions/)).toBeVisible()

      // Key generation is still reachable, just no longer the first thing.
      await expect(
        dialog.getByRole('heading', { name: 'Create new API Key' })
      ).toHaveCount(0)
      await dialog.getByRole('button', { name: 'Continue' }).click()
      await expect(
        page.getByRole('heading', { name: 'Create new API Key' })
      ).toBeVisible()
    })
  }

  test('new API key still goes straight to key generation', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    // That button asks for a key, so device instructions would be noise.
    await page.getByRole('button', { name: 'New API key' }).click()
    await expect(
      page.getByRole('heading', { name: 'Create new API Key' })
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
      page.getByRole('progressbar', { name: 'Last 30 days usage' })
    ).toBeVisible()
    await expect(page.getByText('/ 5,000')).toBeVisible()
    await expect(page.getByText('4,680 remaining')).toBeVisible()

    // The quota counts inbound messages too (the backend counts SMS documents
    // with no type filter), so the label must not claim these are only sends.
    await expect(
      page.getByText(/Counts messages sent and received/)
    ).toBeVisible()

    // The old page decorated every stat with a green trend arrow and captioned
    // all-time totals "Since last year". Nothing computed either.
    await expect(page.getByText('Since last year')).toHaveCount(0)
    await expect(page.getByText('Connected now')).toHaveCount(0)
  })

})
