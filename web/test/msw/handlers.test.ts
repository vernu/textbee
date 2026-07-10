import { describe, expect, it } from 'vitest'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { mockStats, mockSubscription, mockUser } from '../fixtures'

// Sanity checks that the MSW layer intercepts the real axios client the app
// uses, so every later data-layer test is trustworthy. No real backend runs.
describe('MSW mocked API', () => {
  it('returns the mocked current user for whoAmI', async () => {
    const res = await httpBrowserClient.get(ApiEndpoints.auth.whoAmI())
    expect(res.data.data.email).toBe(mockUser.email)
  })

  it('returns the mocked subscription', async () => {
    const res = await httpBrowserClient.get(
      ApiEndpoints.billing.currentSubscription()
    )
    expect(res.data.plan.name).toBe(mockSubscription.plan.name)
    expect(res.data.status).toBe('active')
  })

  it('returns mocked gateway stats', async () => {
    const res = await httpBrowserClient.get(ApiEndpoints.gateway.getStats())
    expect(res.data.data.totalSentSMSCount).toBe(mockStats.totalSentSMSCount)
  })
})
