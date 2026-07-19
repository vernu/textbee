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

  // Checked at both widths: the mobile break was a header pinned to the same
  // offset as the search bar, and the desktop one was a header covering rows
  // and swallowing their clicks.
  for (const viewport of [
    { name: 'mobile', width: 390, height: 700 },
    { name: 'desktop', width: 1280, height: 800 },
  ]) {
    test(`day headers never overlap message rows on ${viewport.name}`, async ({
      page,
      context,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await authenticate(context)
      await mockApi(page)

      // Enough messages across several days to force scrolling.
      const at = (days: number, hours: number) =>
        new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString()
      await page.route('**/api/v1/gateway/devices/*/messages*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: Array.from({ length: 12 }).map((_, i) => ({
              _id: `m${i}`,
              sender: `+2519403617${40 + i}`,
              message: 'A message long enough to wrap onto a second line here',
              status: 'received',
              type: 'received',
              receivedAt: at(Math.floor(i / 3), i),
              createdAt: at(Math.floor(i / 3), i),
            })),
            meta: { total: 12, page: 1, limit: 20, totalPages: 1 },
          }),
        })
      )

      await page.goto('/dashboard/messaging/history')
      await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
      await page.evaluate(() => window.scrollTo(0, 420))

      const headers = await page.locator('h3').all()
      const rows = await page.getByRole('button', { name: /\+2519/ }).all()

      for (const header of headers) {
        const hb = await header.boundingBox()
        if (!hb) continue
        for (const row of rows) {
          const rb = await row.boundingBox()
          if (!rb) continue
          const overlap =
            Math.min(hb.y + hb.height, rb.y + rb.height) - Math.max(hb.y, rb.y)
          expect(
            overlap,
            'a day header must not cover a message row'
          ).toBeLessThanOrEqual(1)
        }
      }

      // A covering header also swallowed the row's click, so the row must
      // still be clickable after scrolling.
      await page.getByRole('button', { name: /\+2519/ }).first().click()
      await expect(page.getByRole('dialog')).toBeVisible()
    })
  }

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

  test('each detail field copies its own value', async ({ page, context }) => {
    await authenticate(context)
    await mockApi(page)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.route('**/api/v1/gateway/devices/*/messages*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              _id: 'copy_1',
              recipient: '+15557654321',
              message: 'Copy me exactly',
              status: 'delivered',
              type: 'sent',
              gatewayMessageId: '665f1c2a9b1e4a0012ab34cd',
              device: { _id: 'device_1', brand: 'Google', model: 'Pixel 8' },
              requestedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          ],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      })
    )

    await page.goto('/dashboard/messaging/history')
    await page.getByRole('button', { name: /Copy me exactly/ }).click()

    const dialog = page.getByRole('dialog')
    const read = () => page.evaluate(() => navigator.clipboard.readText())

    // One button per field, each named for what it copies, replacing a single
    // footer "Copy text" whose target had to be inferred.
    await dialog.getByRole('button', { name: 'Copy number' }).click()
    expect(await read()).toBe('+15557654321')

    await dialog.getByRole('button', { name: 'Copy message' }).click()
    expect(await read()).toBe('Copy me exactly')

    await dialog.getByRole('button', { name: 'Copy gateway ID' }).click()
    expect(await read()).toBe('665f1c2a9b1e4a0012ab34cd')
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
