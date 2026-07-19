/**
 * Plan definitions for the dashboard, mirroring the marketing site's pricing
 * section (textbee-marketing pricing-section.tsx).
 *
 * Deliberately static rather than fetched. The billing plans endpoint returns
 * raw Plan documents with limits and cents, not the customer-facing copy, and
 * an environment whose plans collection is empty left the onboarding step
 * showing "plans could not be loaded" with nothing to choose. Pricing is
 * marketing copy, so it comes from the same place the pricing page does.
 *
 * If the marketing pricing changes, change it here too. plans.test.ts pins the
 * values so a silent drift shows up as a failing test rather than a wrong
 * price in front of a customer.
 */

export type PlanTier = {
  /** Matches the checkout route segment: /checkout/{id}. */
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice?: number
  features: string[]
  /** The tier the picker highlights. */
  isPopular?: boolean
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic SMS gateway features',
    monthlyPrice: 0,
    features: [
      'Send and receive SMS Messages',
      'Register 1 active device',
      'Max 50 messages per day',
      'Up to 300 messages per month',
      'Up to 50 recipients in bulk',
      'Webhook notifications',
      'Basic support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing projects that send every day',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    isPopular: true,
    features: [
      'Everything in Free plan',
      'Register up to 5 active devices',
      'Unlimited daily messages',
      'Up to 5,000 messages per month',
      'No bulk SMS recipient limits',
      'Message templates with variables',
      'Priority support',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    description: 'For higher volume and more devices',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    features: [
      'Everything in Pro plan',
      'Register up to 15 active devices',
      'Unlimited daily messages',
      'Up to 25,000 messages per month',
      'No bulk SMS recipient limits',
      'Message templates with variables',
      'Priority support',
    ],
  },
]

/**
 * Prices are dollar amounts here, not the cents the API deals in.
 *
 * Free renders as "$0" rather than "Free" so it does not simply repeat the
 * tier name directly above it, matching how the pricing page reads.
 */
export function formatPlanPrice(price: number): string {
  if (price <= 0) return '$0'
  return `$${price.toFixed(2)}`
}

export function findPlanTier(name: string | undefined | null) {
  if (!name) return undefined
  const key = name.trim().toLowerCase()
  return PLAN_TIERS.find((tier) => tier.id === key)
}
