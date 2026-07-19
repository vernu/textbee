import type { Subscription, SubscriptionStatus } from '@/lib/api/types'
import { PLAN_TIERS, findPlanTier, type PlanTier } from '@/lib/plans'

export type BillingState = {
  /** Display name for the current plan. Always populated. */
  planName: string
  /** The matching marketing tier, when the plan is one of ours. */
  tier: PlanTier | undefined
  /** True when the user has no subscription record at all. */
  isFree: boolean
  /** Present only for a real subscription. */
  status: SubscriptionStatus | undefined
  /** The tier to sell next, or undefined at the top of the ladder. */
  upgradeTier: PlanTier | undefined
  /** Whether a start/renewal date exists worth rendering. */
  hasBillingDates: boolean
  /** Whether the customer portal applies to this account. */
  canManageBilling: boolean
}

/**
 * Interpret a /billing/current-subscription payload.
 *
 * The endpoint answers in two different shapes. A subscriber gets the
 * Subscription document, which always carries a `status` because the schema
 * requires one. A user with no subscription gets a synthesised
 * `{ plan, isActive, usage }` with no status, no amount and no dates.
 *
 * The billing page used to read that second shape as a subscription with
 * missing fields, so every free user was told their status was "Unknown" and
 * shown two "N/A" billing dates. Absence of a status is not an unknown status:
 * it means there is nothing to have a status.
 *
 * A paid plan name arriving without a status is still genuinely unknown, and
 * is reported that way rather than being flattened into Free.
 */
export function deriveBillingState(
  subscription: Subscription | undefined
): BillingState {
  const rawName = subscription?.plan?.name
  const normalized = rawName?.trim().toLowerCase()
  const tier = findPlanTier(rawName)
  const status = subscription?.status

  const isFree = !status && (!normalized || normalized === 'free')

  // An unrecognised plan name (a bespoke or enterprise arrangement) has no
  // place on the self-serve ladder, so it gets no upgrade CTA.
  const currentIndex = tier ? PLAN_TIERS.indexOf(tier) : isFree ? 0 : -1
  const upgradeTier =
    currentIndex >= 0 ? PLAN_TIERS[currentIndex + 1] : undefined

  return {
    planName: tier?.name ?? rawName?.trim() ?? 'Free',
    tier,
    isFree,
    status,
    upgradeTier,
    hasBillingDates: Boolean(
      subscription?.subscriptionStartDate || subscription?.currentPeriodEnd
    ),
    canManageBilling: !isFree,
  }
}

/**
 * Price badge text for the plan header, or null when there is no charge to
 * show. Free accounts carry no amount, and rendering "Free" next to a plan
 * already named Free just says the same thing twice.
 */
export function billingPriceLabel(
  subscription: Subscription | undefined
): number | null {
  const amount = subscription?.amount
  if (amount == null || amount <= 0) return null
  return amount
}
