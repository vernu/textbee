import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

// Search must find pages by the words a user thinks in, not by our nav labels,
// and it must be reachable on mobile (the trigger used to live only in the
// desktop-only sidebar).

test.describe('command palette search (mocked API, no real backend)', () => {
  test('desktop: keyword search reaches a subroute the sidebar does not list', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: /search/i }).first().click()

    // "csv" appears nowhere in the label "Bulk send"; it matches via keywords.
    await page.getByPlaceholder(/search pages/i).fill('csv')
    await page.getByRole('option', { name: /bulk send/i }).click()

    await expect(page).toHaveURL(/\/dashboard\/messaging\/bulk/)
  })

  test('desktop: business wording finds billing', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: /search/i }).first().click()
    await page.getByPlaceholder(/search pages/i).fill('invoice')
    await page.getByRole('option', { name: /billing/i }).click()

    await expect(page).toHaveURL(/\/dashboard\/account\/billing/)
  })

  test('mobile: search is reachable and reaches webhooks', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    // Webhooks is deliberately absent from the 4-item mobile tab bar, so
    // search is the mobile path to it.
    await page.getByRole('button', { name: /search/i }).first().click()
    await page.getByPlaceholder(/search pages/i).fill('callback')
    await page.getByRole('option', { name: /^webhooks/i }).first().click()

    await expect(page).toHaveURL(/\/dashboard\/webhooks/)
  })

  test('keyboard shortcut opens the palette', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByPlaceholder(/search pages/i)).toBeVisible()
  })

  test('theme can be changed from the palette (the mobile path)', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await authenticate(context)
    await mockApi(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: /search/i }).first().click()
    await page.getByPlaceholder(/search pages/i).fill('dark')
    await page.getByRole('option', { name: /dark theme/i }).click()

    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})
