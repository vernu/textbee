import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'
import { mockDevices } from '../test/fixtures'

test.describe('api guide (mocked API, no real backend)', () => {
  test('shows content immediately, not a collapsed accordion', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging/api-guide')

    // The old guide rendered a collapsed panel that defaulted to closed, so
    // this dedicated page looked empty until you found the chevron.
    await expect(
      page.getByRole('heading', { name: 'Send an SMS' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Send messages in bulk' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Read received messages' })
    ).toBeVisible()
  })

  test('samples use the real device id so they are runnable', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging/api-guide')

    // Fixtures: first device id. The old guide always printed YOUR_DEVICE_ID.
    const deviceId = mockDevices[0]._id
    await expect(page.getByText(deviceId, { exact: false }).first()).toBeVisible()
    await expect(page.getByText('YOUR_DEVICE_ID')).toHaveCount(0)
  })

  test('switching language swaps every sample', async ({ page, context }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging/api-guide')

    // cURL is the default.
    await expect(page.getByText('curl -X POST').first()).toBeVisible()

    await page.getByRole('tab', { name: 'Python' }).click()
    await expect(page.getByText('import os, requests').first()).toBeVisible()
    await expect(page.getByText('curl -X POST')).toHaveCount(0)

    await page.getByRole('tab', { name: 'Go' }).click()
    await expect(page.getByText('package main').first()).toBeVisible()
  })

  test('code can be copied', async ({ page, context }) => {
    await authenticate(context)
    await mockApi(page)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/dashboard/messaging/api-guide')

    await page.getByRole('button', { name: 'Copy code' }).first().click()

    const clipboard = await page.evaluate(() =>
      navigator.clipboard.readText()
    )
    expect(clipboard).toContain('api.textbee.dev')
  })

  test('does not scroll sideways at 375px', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging/api-guide')
    await page.waitForLoadState('networkidle')

    // Code blocks are the classic way to widen a mobile page.
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth)
  })
})
