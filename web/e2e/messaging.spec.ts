import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

test.describe('messaging (mocked API, no real backend)', () => {
  test('renders the send view with route tabs', async ({ page, context }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging')

    await expect(
      page.getByRole('heading', { name: 'Messaging', level: 2 })
    ).toBeVisible()
    // Route tabs are links now.
    const nav = page.getByRole('navigation', { name: 'Section navigation' })
    await expect(nav.getByRole('link', { name: 'Send', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'History' })).toBeVisible()
    // Send is the active tab on the index route.
    await expect(
      nav.getByRole('link', { name: 'Send', exact: true })
    ).toHaveAttribute('aria-current', 'page')
  })

  test('history tab navigates to its own URL and renders mocked messages', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging')

    await page
      .getByRole('navigation', { name: 'Section navigation' })
      .getByRole('link', { name: 'History' })
      .click()

    await expect(page).toHaveURL(/\/dashboard\/messaging\/history/)
    await expect(page.getByText('Hello from textbee')).toBeVisible()
  })

  test('history deep link survives refresh (route-based tabs)', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)

    // Load the subroute directly: this is the refresh-survival guarantee.
    await page.goto('/dashboard/messaging/history')

    const nav = page.getByRole('navigation', { name: 'Section navigation' })
    await expect(nav.getByRole('link', { name: 'History' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    await expect(page.getByText('Hello from textbee')).toBeVisible()
    // Never fell through to an error boundary.
    await expect(page.getByText('This page couldn')).toHaveCount(0)
  })
})
