import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

test.describe('message history (mocked API, no real backend)', () => {
  test('groups messages under day headings', async ({ page, context }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging/history')

    // Fixtures: one message 2h old, one 30h old.
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Yesterday' })).toBeVisible()
    await expect(page.getByText('Hello from textbee')).toBeVisible()
    await expect(page.getByText('Reply from a customer')).toBeVisible()
  })

  test('search is sent to the server, not applied to the loaded page', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)

    const requested: string[] = []
    // fallback(), not continue(): continue() would send the request to the
    // network instead of chaining to the mockApi handler registered earlier.
    await page.route('**/api/v1/gateway/devices/*/messages*', (route) => {
      requested.push(route.request().url())
      return route.fallback()
    })

    await page.goto('/dashboard/messaging/history')
    await expect(page.getByText('Hello from textbee')).toBeVisible()

    await page.getByLabel('Search messages').fill('customer')

    // The whole point of the backend param: a request must carry the term, so
    // results come from all history rather than the 20 rows already loaded.
    await expect
      .poll(() => requested.some((url) => url.includes('search=customer')), {
        message: 'a request carrying search=customer should be issued',
      })
      .toBe(true)
  })

  test('debounces so typing does not fire a request per keystroke', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)

    let searchRequests = 0
    await page.route('**/api/v1/gateway/devices/*/messages*', (route) => {
      if (route.request().url().includes('search=')) searchRequests += 1
      return route.fallback()
    })

    await page.goto('/dashboard/messaging/history')
    await expect(page.getByText('Hello from textbee')).toBeVisible()

    // Type quickly; a naive implementation would fire one request per letter.
    await page.getByLabel('Search messages').pressSequentially('customer', {
      delay: 20,
    })
    await page.waitForTimeout(700)

    expect(searchRequests).toBeGreaterThan(0)
    expect(searchRequests).toBeLessThan(4)
  })

  test('offers a way out when a search matches nothing', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)

    await page.route('**/api/v1/gateway/devices/*/messages*', (route) => {
      if (route.request().url().includes('search=')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
          }),
        })
      }
      return route.fallback()
    })

    await page.goto('/dashboard/messaging/history')
    await page.getByLabel('Search messages').fill('zzzznothing')

    await expect(page.getByText(/No messages match/)).toBeVisible()
    await page.getByRole('button', { name: 'Show all messages' }).click()

    // Clearing restores the unfiltered list.
    await expect(page.getByText('Hello from textbee')).toBeVisible()
  })

  test('a row opens the details dialog with the message body', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging/history')

    await page.getByRole('button', { name: /Hello from textbee/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Hello from textbee')).toBeVisible()
    // Exact timestamp is text here, since the list tooltip is hover-only.
    await expect(dialog.getByText(/\d{4} at \d{1,2}:\d{2}/)).toBeVisible()
  })

  test('replying from a received message keeps a device selected', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging/history')

    await page.getByRole('button', { name: /Reply from a customer/ }).click()
    await page.getByRole('button', { name: 'Reply' }).click()

    // Without a device the composer cannot send, so this must never be empty.
    await expect(page.getByLabel('Send from')).toContainText('Pixel 8')
    await expect(page.getByLabel('To', { exact: true })).toHaveValue(
      '+15551234567'
    )
  })

  test('filters by direction', async ({ page, context }) => {
    await authenticate(context)
    await mockApi(page)

    const requested: string[] = []
    await page.route('**/api/v1/gateway/devices/*/messages*', (route) => {
      requested.push(route.request().url())
      return route.fallback()
    })

    await page.goto('/dashboard/messaging/history')
    await page.getByRole('tab', { name: 'Received' }).click()

    await expect
      .poll(() => requested.some((url) => url.includes('type=received')))
      .toBe(true)
  })
})
