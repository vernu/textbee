import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

test.describe('webhooks (mocked API, no real backend)', () => {
  test('subscriptions view renders with route tabs and mocked webhook', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/webhooks')

    await expect(
      page.getByRole('heading', { name: 'Webhooks', level: 2 })
    ).toBeVisible()
    const nav = page.getByRole('navigation', { name: 'Section navigation' })
    await expect(
      nav.getByRole('link', { name: 'Webhooks', exact: true })
    ).toHaveAttribute('aria-current', 'page')
    // Mocked webhook subscription from the fixtures.
    await expect(
      page.getByText('https://example.com/webhooks/textbee').first()
    ).toBeVisible()
  })

  test('deliveries deep link renders filters (refresh survival)', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/webhooks/deliveries')

    const nav = page.getByRole('navigation', { name: 'Section navigation' })
    await expect(nav.getByRole('link', { name: 'Deliveries' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    await expect(
      page.getByRole('heading', { name: 'Device', exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Date Range', exact: true })
    ).toBeVisible()
    // Never fell through to an error boundary.
    await expect(page.getByText('This page couldn')).toHaveCount(0)
  })
})
