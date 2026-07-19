import { describe, expect, it } from 'vitest'
import { STEPS, computeStepStates } from './steps'

const byId = (id: string) => STEPS.find((s) => s.id === id)!

describe('onboarding steps', () => {
  it('verify_email is done only when the user has emailVerifiedAt', () => {
    expect(byId('verify_email').checkDone({}, undefined, null, [])).toBe(false)
    expect(
      byId('verify_email').checkDone(
        { emailVerifiedAt: '2026-01-01' },
        undefined,
        null,
        []
      )
    ).toBe(true)
  })

  it('download_app is done with a device or when skipped', () => {
    const step = byId('download_app')
    expect(step.checkDone({}, { totalDeviceCount: 0 }, null, [])).toBe(false)
    expect(step.checkDone({}, { totalDeviceCount: 1 }, null, [])).toBe(true)
    expect(step.checkDone({}, { totalDeviceCount: 0 }, null, ['download_app'])).toBe(
      true
    )
  })

  it('choose_plan is done on a paid plan or when skipped', () => {
    const step = byId('choose_plan')
    expect(step.checkDone({}, undefined, { plan: { name: 'Free' } }, [])).toBe(false)
    expect(step.checkDone({}, undefined, { plan: { name: 'Pro' } }, [])).toBe(true)
    expect(step.checkDone({}, undefined, null, ['choose_plan'])).toBe(true)
  })

  it('api_key / register_device / first_message follow the stats counters', () => {
    expect(byId('api_key').checkDone({}, { totalApiKeyCount: 1 }, null, [])).toBe(true)
    expect(
      byId('register_device').checkDone({}, { totalDeviceCount: 1 }, null, [])
    ).toBe(true)
    expect(
      byId('first_message').checkDone({}, { totalSentSMSCount: 1 }, null, [])
    ).toBe(true)
  })

  it('computeStepStates marks a fully-set-up paid user as all done', () => {
    const states = computeStepStates(
      { emailVerifiedAt: '2026-01-01' },
      { totalApiKeyCount: 2, totalDeviceCount: 1, totalSentSMSCount: 10 },
      { plan: { name: 'Pro' } },
      []
    )
    expect(states.every((s) => s.isDone)).toBe(true)
  })

  it('computeStepStates marks a brand-new user as nothing done', () => {
    const states = computeStepStates({}, {}, null, [])
    expect(states.some((s) => s.isDone)).toBe(false)
  })
})
