import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { API_BASE_URL } from '@/test/fixtures'

// Own getSession mock (overriding the global one in test/setup.ts) so calls
// can be counted and resolved per test.
const getSessionMock = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth/react')>()
  return { ...actual, getSession: getSessionMock }
})

// The token lives in module state, so each test loads a fresh module copy.
async function loadClient() {
  vi.resetModules()
  return import('@/lib/httpBrowserClient')
}

function captureAuthHeaders() {
  const headers: (string | null)[] = []
  server.use(
    http.get(`${API_BASE_URL}/ping`, ({ request }) => {
      headers.push(request.headers.get('authorization'))
      return HttpResponse.json({ ok: true })
    })
  )
  return headers
}

afterEach(() => {
  getSessionMock.mockReset()
})

describe('httpBrowserClient auth interceptor', () => {
  it('attaches a seeded token without calling getSession', async () => {
    const { default: client, setSessionToken } = await loadClient()
    setSessionToken('abc')
    const headers = captureAuthHeaders()

    await client.get('/ping')

    expect(headers).toEqual(['Bearer abc'])
    expect(getSessionMock).not.toHaveBeenCalled()
  })

  it('dedupes concurrent session fetches when the token is not seeded', async () => {
    getSessionMock.mockResolvedValue({ user: { accessToken: 'tok1' } })
    const { default: client } = await loadClient()
    const headers = captureAuthHeaders()

    await Promise.all([client.get('/ping'), client.get('/ping')])

    expect(getSessionMock).toHaveBeenCalledTimes(1)
    expect(headers).toEqual(['Bearer tok1', 'Bearer tok1'])
  })

  it('sends no header and no session fetch when seeded signed out', async () => {
    const { default: client, setSessionToken } = await loadClient()
    // null means known signed out (the 401 handler and the auth pages), so
    // requests must not fall back to a /api/auth/session round trip.
    setSessionToken(null)
    const headers = captureAuthHeaders()

    await client.get('/ping')

    expect(headers).toEqual([null])
    expect(getSessionMock).not.toHaveBeenCalled()
  })

  it('recovers with a fresh fetch after a failed session lookup', async () => {
    getSessionMock.mockRejectedValueOnce(new Error('network down'))
    getSessionMock.mockResolvedValueOnce({ user: { accessToken: 'tok2' } })
    const { default: client } = await loadClient()
    const headers = captureAuthHeaders()

    await expect(client.get('/ping')).rejects.toThrow('network down')
    await client.get('/ping')

    expect(getSessionMock).toHaveBeenCalledTimes(2)
    expect(headers).toEqual(['Bearer tok2'])
  })
})
