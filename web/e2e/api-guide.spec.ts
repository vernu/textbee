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

  // The guide applies Prism themes, so it must render with the Prism
  // highlighter. It previously used the package's default export, which is the
  // highlight.js build: that emits hljs-* classes the Prism theme never styles
  // (so samples went uncoloured) and compiles in every language it supports.
  test('samples are highlighted by Prism, in every language', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard/messaging/api-guide')

    for (const language of ['cURL', 'Node.js', 'Python', 'PHP', 'Go']) {
      await page.getByRole('tab', { name: language, exact: true }).click()
      await expect(
        page.locator('pre code .token').first(),
        `${language} samples must carry Prism token markup`
      ).toBeVisible()
    }

    // A registered language yields more than one token type; a missing one
    // would fall back to a single undifferentiated text run.
    expect(
      await page.locator('pre code .token').count()
    ).toBeGreaterThan(5)
  })

  test('code can be copied', async ({ page, context }) => {
    await authenticate(context)
    await mockApi(page)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/dashboard/messaging/api-guide')

    await page.getByRole('button', { name: 'Copy code' }).first().click()

    // The button relabels itself only after the async clipboard write resolves,
    // so this is the signal that there is something to read back.
    await expect(page.getByRole('button', { name: 'Copied' }).first()).toBeVisible()

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
    // Not networkidle: link prefetching keeps the network busy, so that state
    // can go unreached under parallel workers. A rendered sample proves the
    // code blocks (the thing that would widen the page) are laid out.
    await expect(page.getByText('curl -X POST').first()).toBeVisible()

    // Code blocks are the classic way to widen a mobile page.
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth)
  })
})
