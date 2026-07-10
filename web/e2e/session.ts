import type { BrowserContext } from '@playwright/test'
import { encode } from 'next-auth/jwt'
import { TEST_AUTH_SECRET } from '../playwright.config'
import { mockUser, TEST_ACCESS_TOKEN } from '../test/fixtures'

// NextAuth v4 default session cookie name over http (non-secure).
const SESSION_COOKIE = 'next-auth.session-token'

// Mint a valid NextAuth JWT session cookie so middleware's getToken() accepts
// the request and the app treats us as authenticated, without ever running the
// real login flow or contacting a backend.
export async function authenticate(context: BrowserContext) {
  const token = await encode({
    token: {
      sub: mockUser.id,
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      phone: mockUser.phone,
      role: mockUser.role,
      accessToken: TEST_ACCESS_TOKEN,
    },
    secret: TEST_AUTH_SECRET,
  })

  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ])
}
