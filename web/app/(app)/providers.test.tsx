import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import Providers from './providers'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { server } from '@/test/msw/server'
import { API_BASE_URL, TEST_ACCESS_TOKEN } from '@/test/fixtures'
import { mockSession } from '@/test/render'

// Own getSession mock (overriding the global one in test/setup.ts) so the
// no-session-fetch guarantee below is a real call-count assertion.
const getSessionSpy = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth/react')>()
  return { ...actual, getSession: getSessionSpy }
})

function DefaultsProbe() {
  const queries = useQueryClient().getDefaultOptions().queries
  return (
    <div data-testid='defaults'>
      {`${queries?.staleTime}|${String(queries?.refetchOnWindowFocus)}|${String(
        queries?.retry
      )}`}
    </div>
  )
}

describe('Providers', () => {
  it('sets query defaults: 60s staleTime, no focus refetch, one retry', () => {
    render(
      <Providers session={mockSession}>
        <DefaultsProbe />
      </Providers>
    )
    expect(screen.getByTestId('defaults')).toHaveTextContent('60000|false|1')
  })

  it('seeds the API token from the server session with zero session fetches', async () => {
    let authHeader: string | null = null
    server.use(
      http.get(`${API_BASE_URL}/ping`, ({ request }) => {
        authHeader = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    render(<Providers session={mockSession}>{null}</Providers>)
    await httpBrowserClient.get('/ping')

    expect(authHeader).toBe(`Bearer ${TEST_ACCESS_TOKEN}`)
    expect(getSessionSpy).not.toHaveBeenCalled()
  })
})
