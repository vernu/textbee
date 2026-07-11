import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

test.describe('webhooks (mocked API, no real backend)', () => {
  test('history page renders filters without crashing', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/webhooks')

    await expect(
      page.getByRole('heading', { name: 'Device', exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Event Type', exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Date Range', exact: true })
    ).toBeVisible()
    // Never fell through to an error boundary.
    await expect(page.getByText('This page couldn')).toHaveCount(0)
  })
})
