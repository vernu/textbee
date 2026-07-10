import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { TestProviders } from '@/test/render'
import { mockDevices, mockSubscription, mockUser } from '@/test/fixtures'
import { useCurrentUser, useDevices, useSubscription } from './hooks'

// Verifies the typed hooks talk to the mocked API and unwrap the various
// response envelopes correctly. No real backend is contacted (MSW).
const wrapper = TestProviders

describe('data hooks', () => {
  it('useCurrentUser unwraps res.data.data', async () => {
    const { result } = renderHook(() => useCurrentUser(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.email).toBe(mockUser.email)
  })

  it('useSubscription returns the raw body', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.plan?.name).toBe(mockSubscription.plan.name)
  })

  it('useDevices unwraps to the device array', async () => {
    const { result } = renderHook(() => useDevices(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(mockDevices.length)
    expect(result.current.data?.[0]._id).toBe(mockDevices[0]._id)
  })
})
