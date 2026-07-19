import { describe, expect, it } from 'vitest'
import { billingPriceLabel, deriveBillingState } from './billing'

// The exact shape billing.service.ts synthesises when findOne turns up no
// subscription: a plan and usage, no status, no amount, no dates.
const freePayload = {
  plan: { name: 'free', dailyLimit: 50, monthlyLimit: 300 },
  isActive: true,
  usage: { processedSmsToday: 3 },
}

const proPayload = {
  plan: { name: 'Pro' },
  status: 'active',
  amount: 999,
  currency: 'usd',
  recurringInterval: 'month',
  subscriptionStartDate: '2026-06-01T00:00:00.000Z',
  currentPeriodEnd: '2026-08-01T00:00:00.000Z',
}

describe('deriveBillingState', () => {
  // The defect this helper exists for: a free user was shown "Unknown".
  it('reads the no-subscription payload as Free, not as unknown', () => {
    const state = deriveBillingState(freePayload)

    expect(state.isFree).toBe(true)
    expect(state.status).toBeUndefined()
    expect(state.planName).toBe('Free')
  })

  it('treats a missing subscription entirely as Free', () => {
    expect(deriveBillingState(undefined).isFree).toBe(true)
    expect(deriveBillingState({}).isFree).toBe(true)
  })

  // Absence of a status means "no subscription". A status that is absent from
  // a payload that clearly IS a paid plan is a different thing, and must not
  // be quietly downgraded to Free.
  it('does not flatten a paid plan with a missing status into Free', () => {
    const state = deriveBillingState({ plan: { name: 'Pro' } })

    expect(state.isFree).toBe(false)
    expect(state.planName).toBe('Pro')
  })

  it('reads a real subscription without changing its status', () => {
    const state = deriveBillingState(proPayload)

    expect(state.isFree).toBe(false)
    expect(state.status).toBe('active')
    expect(state.planName).toBe('Pro')
  })

  it('uses the marketing casing rather than whatever the DB stored', () => {
    expect(deriveBillingState(freePayload).planName).toBe('Free')
    expect(deriveBillingState({ plan: { name: '  SCALE ' } }).planName).toBe(
      'Scale'
    )
  })

  describe('upgradeTier', () => {
    it('sells Pro to a free user', () => {
      expect(deriveBillingState(freePayload).upgradeTier?.id).toBe('pro')
    })

    it('sells Scale to a Pro user', () => {
      expect(deriveBillingState(proPayload).upgradeTier?.id).toBe('scale')
    })

    it('sells nothing at the top of the ladder', () => {
      const state = deriveBillingState({
        plan: { name: 'Scale' },
        status: 'active',
      })
      expect(state.upgradeTier).toBeUndefined()
    })

    // A bespoke arrangement is not on the self-serve ladder, so pushing it up
    // one rung would be wrong in both directions.
    it('sells nothing for an unrecognised plan', () => {
      const state = deriveBillingState({
        plan: { name: 'Enterprise' },
        status: 'active',
      })
      expect(state.upgradeTier).toBeUndefined()
      expect(state.planName).toBe('Enterprise')
    })
  })

  describe('hasBillingDates', () => {
    it('is false for a free account, which has no dates to show', () => {
      expect(deriveBillingState(freePayload).hasBillingDates).toBe(false)
    })

    it('is true once a subscription carries a date', () => {
      expect(deriveBillingState(proPayload).hasBillingDates).toBe(true)
    })
  })

  describe('canManageBilling', () => {
    it('is false for a free account with nothing to manage', () => {
      expect(deriveBillingState(freePayload).canManageBilling).toBe(false)
    })

    it('is true for a subscriber', () => {
      expect(deriveBillingState(proPayload).canManageBilling).toBe(true)
    })
  })
})

describe('billingPriceLabel', () => {
  it('returns the amount for a paying customer', () => {
    expect(billingPriceLabel(proPayload)).toBe(999)
  })

  it('returns nothing when there is no charge', () => {
    expect(billingPriceLabel(freePayload)).toBeNull()
    expect(billingPriceLabel({ amount: 0 })).toBeNull()
    expect(billingPriceLabel(undefined)).toBeNull()
  })
})
