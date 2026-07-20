import { expect, test } from '@playwright/test'
import { authenticate } from './session'
import { mockApi } from './mock-api'

const checkoutRequest = (page: import('@playwright/test').Page) =>
  page.waitForRequest(
    (r) => r.url().includes('/billing/checkout') && r.method() === 'POST'
  )

test.describe('checkout (mocked API, no real backend)', () => {
  // The regression this file exists for: a Next 16 upgrade left the page
  // reading `params` synchronously, so planName reached the API as undefined
  // and every paid checkout failed. Asserting on the rendered page would not
  // have caught it, only asserting on the request body does.
  test('sends the plan from the URL segment, not undefined', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)

    const request = checkoutRequest(page)
    await page.goto('/checkout/pro?billingInterval=monthly')

    expect((await request).postDataJSON()).toMatchObject({
      planName: 'pro',
      billingInterval: 'monthly',
    })
  })

  test('carries the yearly interval through to the API', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)

    const request = checkoutRequest(page)
    await page.goto('/checkout/scale?billingInterval=yearly')

    expect((await request).postDataJSON()).toMatchObject({
      planName: 'scale',
      billingInterval: 'yearly',
    })
  })

  // Marketing links already carry the interval, so that funnel must not gain
  // an extra confirmation step.
  test('redirects straight through when the URL names an interval', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page)
    await page.goto('/checkout/pro?billingInterval=yearly')

    await expect(page).toHaveURL(/polar-checkout-mock=1/)
  })

  test.describe('when the URL names no interval', () => {
    test('asks instead of guessing, with yearly preselected', async ({
      page,
      context,
    }) => {
      await authenticate(context)
      await mockApi(page)
      await page.goto('/checkout/pro')

      await expect(page.getByRole('radio', { name: /Yearly/ })).toBeChecked()
      await expect(page.getByRole('radio', { name: /Monthly/ })).not.toBeChecked()
      await expect(
        page.getByRole('button', { name: 'Continue to checkout' })
      ).toBeVisible()
    })

    test('posts nothing until the user confirms', async ({ page, context }) => {
      await authenticate(context)
      await mockApi(page)

      let posted = false
      page.on('request', (r) => {
        if (r.url().includes('/billing/checkout') && r.method() === 'POST') {
          posted = true
        }
      })

      await page.goto('/checkout/pro')
      await expect(
        page.getByRole('button', { name: 'Continue to checkout' })
      ).toBeVisible()

      expect(posted).toBe(false)
    })

    test('defaults to yearly on confirm', async ({ page, context }) => {
      await authenticate(context)
      await mockApi(page)
      await page.goto('/checkout/pro')

      const request = checkoutRequest(page)
      await page.getByRole('button', { name: 'Continue to checkout' }).click()

      expect((await request).postDataJSON()).toMatchObject({
        planName: 'pro',
        billingInterval: 'yearly',
      })
    })

    // The case where a wrong default would charge 10x.
    test('honours an explicit switch to monthly', async ({ page, context }) => {
      await authenticate(context)
      await mockApi(page)
      await page.goto('/checkout/pro')

      await page.getByRole('radio', { name: /Monthly/ }).check()

      const request = checkoutRequest(page)
      await page.getByRole('button', { name: 'Continue to checkout' }).click()

      expect((await request).postDataJSON()).toMatchObject({
        planName: 'pro',
        billingInterval: 'monthly',
      })
    })
  })

  test('surfaces a failure once, without retrying a rejected request', async ({
    page,
    context,
  }) => {
    await authenticate(context)
    await mockApi(page, { checkoutError: 'Plan "nope" was not found.' })

    let posts = 0
    page.on('request', (r) => {
      if (r.url().includes('/billing/checkout') && r.method() === 'POST') {
        posts += 1
      }
    })

    await page.goto('/checkout/nope?billingInterval=monthly')

    await expect(page.getByText('Plan "nope" was not found.')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Back to your account' })
    ).toBeVisible()
    expect(posts).toBe(1)
  })
})
