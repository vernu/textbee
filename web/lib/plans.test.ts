import { describe, expect, it } from 'vitest'
import {
  PLAN_TIERS,
  findPlanTier,
  formatPlanPrice,
  formatPriceCaption,
  monthlyEquivalent,
  yearlySavingPercent,
} from './plans'

const pro = PLAN_TIERS.find((t) => t.id === 'pro')!
const scale = PLAN_TIERS.find((t) => t.id === 'scale')!
const free = PLAN_TIERS.find((t) => t.id === 'free')!

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

// The yearly saving is quoted to customers, so it is derived from PLAN_TIERS
// and asserted here rather than written into the markup as a literal.
describe('yearly pricing', () => {
  it('derives the per-month equivalent of a yearly plan', () => {
    expect(monthlyEquivalent(pro)).toBeCloseTo(8.3325, 4)
    expect(monthlyEquivalent(scale)).toBeCloseTo(24.99917, 4)
  })

  it('has no yearly equivalent for a tier without a yearly price', () => {
    expect(monthlyEquivalent(free)).toBeUndefined()
    expect(yearlySavingPercent(free)).toBeUndefined()
  })

  // 12 x $9.99 = $119.88 against $99.99 is $19.89 saved, or 16.6%.
  it('quotes a saving the arithmetic actually supports', () => {
    expect(yearlySavingPercent(pro)).toBe(17)
    expect(yearlySavingPercent(scale)).toBe(17)
  })

  // Guards the claim itself: paying yearly must never cost more than monthly.
  it('never quotes a saving on a plan that is not cheaper yearly', () => {
    for (const tier of PLAN_TIERS) {
      if (!tier.yearlyPrice) continue
      expect(tier.yearlyPrice).toBeLessThan(tier.monthlyPrice * 12)
    }
  })

  // The picker prints a headline per-month figure, so its caption must not
  // repeat it.
  it('captions a headline price without repeating it', () => {
    expect(formatPriceCaption(pro)).toBe(
      'billed yearly at $99.99, or $9.99 monthly'
    )
    expect(formatPriceCaption(scale)).toBe(
      'billed yearly at $299.99, or $29.99 monthly'
    )
  })

  it('captions the free tier without quoting a price', () => {
    expect(formatPriceCaption(free)).toBe('no card required')
  })

  it('captions a paid tier that has no yearly option', () => {
    expect(formatPriceCaption({ ...pro, yearlyPrice: undefined })).toBe(
      '$9.99 billed monthly'
    )
  })

  // The caption is the only place the yearly total is quoted, so it has to
  // carry both figures.
  it('quotes both the yearly total and the monthly price', () => {
    for (const tier of [pro, scale]) {
      expect(formatPriceCaption(tier)).toContain(
        formatPlanPrice(tier.monthlyPrice)
      )
      expect(formatPriceCaption(tier)).toContain(
        formatPlanPrice(tier.yearlyPrice!)
      )
    }
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
