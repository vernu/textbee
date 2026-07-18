import { describe, expect, it } from 'vitest'
import { PLAN_TIERS, findPlanTier, formatPlanPrice } from './plans'

// These values mirror the marketing pricing page. They are pinned here so that
// if the two drift apart, this fails instead of quietly showing a customer a
// price we do not charge.
describe('PLAN_TIERS', () => {
  it('matches the marketing pricing page', () => {
    expect(
      PLAN_TIERS.map((t) => [t.id, t.monthlyPrice, t.yearlyPrice])
    ).toEqual([
      ['free', 0, undefined],
      ['pro', 9.99, 99.99],
      ['scale', 29.99, 299.99],
    ])
  })

  it('offers the three self-serve tiers, Scale included', () => {
    expect(PLAN_TIERS.map((t) => t.name)).toEqual(['Free', 'Pro', 'Scale'])
  })

  it('highlights exactly one tier', () => {
    expect(PLAN_TIERS.filter((t) => t.isPopular)).toHaveLength(1)
    expect(PLAN_TIERS.find((t) => t.isPopular)?.id).toBe('pro')
  })

  it('gives every tier features to show', () => {
    for (const tier of PLAN_TIERS) {
      expect(tier.features.length).toBeGreaterThan(0)
      expect(tier.description).not.toBe('')
    }
  })

  // The id doubles as the /checkout/{id} segment, so it has to stay
  // URL-clean.
  it('uses lowercase ids safe for the checkout route', () => {
    for (const tier of PLAN_TIERS) {
      expect(tier.id).toMatch(/^[a-z][a-z0-9-]*$/)
    }
  })
})

describe('formatPlanPrice', () => {
  // "$0" not "Free", so the price does not just repeat the tier name above it.
  it('renders the free tier as a price', () => {
    expect(formatPlanPrice(0)).toBe('$0')
  })

  it('always shows cents on a paid plan', () => {
    expect(formatPlanPrice(9.99)).toBe('$9.99')
    expect(formatPlanPrice(30)).toBe('$30.00')
  })
})

describe('findPlanTier', () => {
  it('is forgiving about casing and whitespace', () => {
    expect(findPlanTier('Pro')?.id).toBe('pro')
    expect(findPlanTier('  SCALE ')?.id).toBe('scale')
  })

  it('returns nothing for an unknown or missing name', () => {
    expect(findPlanTier('enterprise')).toBeUndefined()
    expect(findPlanTier(undefined)).toBeUndefined()
    expect(findPlanTier(null)).toBeUndefined()
    expect(findPlanTier('')).toBeUndefined()
  })
})
