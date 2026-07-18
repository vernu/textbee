import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

// Regression guard for mobile horizontal overflow: at 375px no page may be
// wider than the viewport (the bug showed a blank strip when scrolling right).
// document.scrollingElement covers the page; body scrollWidth catches clipped
// overflow introduced inside the layout.

const AUTHED_PAGES = [
  '/dashboard',
  '/dashboard/messaging',
  '/dashboard/messaging/bulk',
  '/dashboard/messaging/history',
  '/dashboard/webhooks',
  '/dashboard/account',
]

async function expectNoHorizontalScroll(page: import('@playwright/test').Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, 'page must not scroll sideways at 375px').toBeLessThanOrEqual(
    innerWidth
  )
}

test.describe('no horizontal overflow at 375px (mocked API)', () => {
  test.use({ viewport: { width: 375, height: 800 } })

  for (const path of AUTHED_PAGES) {
    test(`authed page ${path}`, async ({ page, context }) => {
      await authenticate(context)
      await mockApi(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expectNoHorizontalScroll(page)
    })
  }

  test('login page', async ({ page }) => {
    await mockApi(page)
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expectNoHorizontalScroll(page)
  })
})
