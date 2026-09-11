import { test, expect } from '@playwright/test'

/*
 * textbee is open source, so a self-hosted dashboard must load no analytics or
 * ad-platform script unless its operator opts in. The Playwright web server
 * starts with no analytics env vars, which is exactly the self-host default.
 *
 * accounts.google.com is not on this list because the test server does set a
 * Google client id, so Google sign-in is meant to load here. The unconfigured
 * case for that one is covered in components/shared/analytics-gating.test.tsx.
 */
const BLOCKED_HOSTS = [
  'googletagmanager.com',
  'google-analytics.com',
  'clarity.ms',
  'connect.facebook.net',
  'facebook.com/tr',
  'static.ads-twitter.com',
  'vercel-insights.com',
  'cdn.supporthq.app',
]

const PAGES = ['/login', '/register', '/download']

for (const path of PAGES) {
  test(`${path} loads no third-party analytics when unconfigured`, async ({
    page,
  }) => {
    const seen: string[] = []
    page.on('request', (request) => {
      const url = request.url()
      if (BLOCKED_HOSTS.some((host) => url.includes(host))) seen.push(url)
    })

    // Not networkidle: the e2e server points the API at a host that never
    // answers, so the page never goes idle. Analytics scripts load right after
    // hydration, so a short settle after load is enough and is deterministic.
    await page.goto(path, { waitUntil: 'load' })
    await page.waitForTimeout(2000)

    expect(seen, `unexpected third-party requests on ${path}`).toEqual([])
  })
}
