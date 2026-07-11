import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

test.describe('messaging (mocked API, no real backend)', () => {
  test('renders the messaging screen and its tabs', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging')

    await expect(
      page.getByRole('heading', { name: 'Messaging', level: 2 })
    ).toBeVisible()
    // Tab list is present.
    await expect(
      page.getByRole('tab', { name: 'Send', exact: true })
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: 'History' })).toBeVisible()
  })

  test('history tab loads mocked messages without crashing', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging')

    await page.getByRole('tab', { name: 'History' }).click()

    // Mocked device message body from the fixtures.
    await expect(page.getByText('Hello from textbee')).toBeVisible()
    // Never fell through to an error boundary.
    await expect(page.getByText('This page couldn')).toHaveCount(0)
  })
})
