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

  // The dialog stays mounted for the whole session, so its defaultValues (and
  // the uuid inside them) were evaluated exactly once. A bare form.reset()
  // then restored that same secret, and every webhook created in one session
  // shared it. Compromising one endpoint's secret would expose them all.
  test('each created webhook gets its own signing secret', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)

    const secrets: string[] = []
    await page.route('**/api/v1/webhooks', (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      secrets.push(route.request().postDataJSON()?.signingSecret)
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: { _id: `wh_${secrets.length}` } }),
      })
    })

    await page.goto('/dashboard/webhooks')

    for (const url of [
      'https://example.com/hook-one',
      'https://example.com/hook-two',
    ]) {
      await page.getByRole('button', { name: 'Create Webhook' }).first().click()
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('Create Webhook')).toBeVisible()
      await dialog.getByLabel('Delivery URL').fill(url)
      await dialog.getByRole('button', { name: 'Create' }).click()
      await expect(dialog).toBeHidden()
    }

    expect(secrets).toHaveLength(2)
    expect(secrets[0]).toBeTruthy()
    expect(secrets[1]).not.toBe(secrets[0])
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
