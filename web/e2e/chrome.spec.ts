import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

// Guards for the app chrome: the footer used to be rendered above the
// dashboard's fixed sidebar, so the sidebar painted over its left edge, and the
// fixed mobile tab bar covered its bottom edge.

test.describe('app chrome (mocked API, no real backend)', () => {
  test('desktop: sidebar does not overlap the footer', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    const sidebar = page.locator('aside')
    const footerBox = await footer.boundingBox()
    const sidebarBox = await sidebar.boundingBox()

    expect(footerBox, 'footer must have a layout box').not.toBeNull()
    expect(sidebarBox, 'sidebar must have a layout box').not.toBeNull()

    // The footer must start where the sidebar ends, not underneath it.
    expect(
      footerBox!.x,
      'footer must start at or after the sidebar right edge'
    ).toBeGreaterThanOrEqual(sidebarBox!.x + sidebarBox!.width - 1)
  })

  test('mobile: bottom tab bar does not cover the footer', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    // Scroll to the very bottom so the footer is in view.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    const footerBox = await footer.boundingBox()
    const tabBarBox = await page.locator('nav.fixed').first().boundingBox()

    expect(footerBox, 'footer must have a layout box').not.toBeNull()
    expect(tabBarBox, 'mobile tab bar must have a layout box').not.toBeNull()

    // The footer's last pixel must sit above the tab bar's first pixel.
    expect(
      footerBox!.y + footerBox!.height,
      'footer bottom must clear the fixed tab bar'
    ).toBeLessThanOrEqual(tabBarBox!.y + 1)
  })

  test('mobile: footer links stack vertically', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    const links = page.locator('footer nav a')
    const count = await links.count()
    expect(count).toBeGreaterThan(2)

    // Stacked means every link sits on its own row, so each y is distinct.
    const ys: number[] = []
    for (let i = 0; i < count; i += 1) {
      const box = await links.nth(i).boundingBox()
      expect(box).not.toBeNull()
      ys.push(Math.round(box!.y))
    }
    expect(new Set(ys).size, 'each footer link should be on its own row').toBe(
      count
    )
  })

  test('desktop: footer links share rows instead of stacking', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')
    // Text metrics decide wrapping, so wait for fonts before measuring.
    await page.evaluate(() => document.fonts.ready)

    const links = page.locator('footer nav a')
    const count = await links.count()

    const ys: number[] = []
    for (let i = 0; i < count; i += 1) {
      const box = await links.nth(i).boundingBox()
      ys.push(Math.round(box!.y))
    }

    // The row layout wraps by design, so the guarantee is "not one per row",
    // not "exactly one row": asserting a single row made this flaky whenever
    // font metrics pushed a link onto a second line.
    expect(new Set(ys).size).toBeLessThan(count)
  })

  test('top bar is reduced to brand and account', async ({ page, context }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    const header = page.locator('header')
    await expect(
      header.getByRole('link', { name: /contribute/i })
    ).toHaveCount(0)
    await expect(header.getByRole('button', { name: 'Toggle theme' })).toHaveCount(
      0
    )
  })

  test('theme control lives in the sidebar', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    const themeGroup = page
      .locator('aside')
      .getByRole('group', { name: 'Color theme' })
    await expect(themeGroup).toBeVisible()

    await themeGroup.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await themeGroup.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})
