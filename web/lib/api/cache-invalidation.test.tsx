import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClient } from '@tanstack/react-query'
import { server } from '@/test/msw/server'
import { TestProviders } from '@/test/render'
import { API_BASE_URL, mockUser } from '@/test/fixtures'
import { ApiEndpoints } from '@/config/api'
import { queryKeys } from './query-keys'
import VerifyEmailAlert from '@/app/(app)/dashboard/(components)/alerts/verify-email-alert'
import GenerateApiKey from '@/app/(app)/dashboard/(components)/api-keys/generate-api-key'

const url = (path: string) => `${API_BASE_URL}${path.split('?')[0]}`

/**
 * These cover cache bugs that are invisible on inspection: the code looks
 * correct at every individual call site, and only the relationship between
 * sites is wrong. Both shipped to production.
 */
describe('cache invalidation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    // Not makeTestQueryClient: it sets gcTime 0, which collects any cache
    // entry the moment it has no observer, so priming a cache to assert it
    // gets invalidated would never survive to be asserted on.
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  const renderWith = (ui: React.ReactElement) =>
    render(<TestProviders queryClient={queryClient}>{ui}</TestProviders>)

  // /auth/who-am-i used to be cached under two keys, ['whoAmI'] and
  // ['currentUser'], so invalidating one left the other serving stale data.
  // A user who verified their email still saw the "verify your email" banner,
  // because the code that refreshed the user used the other key.
  it('one invalidation refreshes every consumer of the current user', async () => {
    let verified = false
    server.use(
      http.get(url(ApiEndpoints.auth.whoAmI()), () =>
        HttpResponse.json({
          data: {
            ...mockUser,
            emailVerifiedAt: verified ? new Date().toISOString() : null,
          },
        })
      )
    )

    const { container } = renderWith(<VerifyEmailAlert />)
    // Selected by href, not by label: the banner picks its CTA text at random
    // from five variants, so a text matcher here would be flaky.
    const banner = () => container.querySelector('a[href="/verify-email"]')

    // Unverified: the banner is up.
    await waitFor(() => expect(banner()).toBeInTheDocument())

    // The user verifies elsewhere, and something invalidates the user query
    // using the canonical key.
    verified = true
    await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser })

    // The banner must notice. Under the two-key split it never did.
    await waitFor(() => expect(banner()).toBeNull())
  })

  // The generate handler invalidated ['apiKeys', 'stats'], a key no query uses.
  // react-query matches by prefix, so it matched neither the key list
  // (['apiKeys', 'active']) nor the dashboard stats (['stats']): generating a
  // key refreshed nothing at all.
  it('generating an API key refreshes both the key list and the stats', async () => {
    server.use(
      http.post(url(ApiEndpoints.auth.generateApiKey()), () =>
        HttpResponse.json({ data: 'new-api-key' })
      )
    )

    // Prime the two caches a new key must invalidate.
    queryClient.setQueryData(queryKeys.apiKeys('active'), { data: [] })
    queryClient.setQueryData(queryKeys.stats, { totalApiKeyCount: 0 })

    renderWith(<GenerateApiKey />)

    // The trigger and the dialog's confirm button carry the same label, so the
    // confirm has to be scoped to the dialog.
    await userEvent.click(
      screen.getByRole('button', { name: /Generate API Key/i })
    )
    const confirmDialog = await screen.findByRole('dialog', {
      name: /Create new API Key/i,
    })
    await userEvent.click(
      within(confirmDialog).getByRole('button', { name: /Generate API Key/i })
    )

    await waitFor(() => {
      expect(
        queryClient.getQueryState(queryKeys.apiKeys('active'))?.isInvalidated,
        'the API key list must be invalidated'
      ).toBe(true)
      expect(
        queryClient.getQueryState(queryKeys.stats)?.isInvalidated,
        'the dashboard stats must be invalidated'
      ).toBe(true)
    })
  })
})
