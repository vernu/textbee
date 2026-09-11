// Hosts that must never be contacted by an instance with no analytics
// providers configured. Shared by the vitest gating test and the Playwright
// self-host check so the two can never drift apart.
export const BLOCKED_HOSTS = [
  'googletagmanager.com',
  'google-analytics.com',
  'clarity.ms',
  'connect.facebook.net',
  'facebook.com/tr',
  'static.ads-twitter.com',
  'vercel-insights.com',
  'cdn.supporthq.app',
  'accounts.google.com',
]
