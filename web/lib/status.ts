import {
  AlertTriangle,
  Check,
  CircleHelp,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { SubscriptionStatus } from '@/lib/api/types'

// Subscription status colors, previously repeated across subscription-info's
// badge, icon and text. Returns semantic tone classes for text + background.
export type StatusTone = {
  text: string
  bg: string
}

export function subscriptionStatusTone(
  status: SubscriptionStatus | null | undefined
): StatusTone {
  switch (status) {
    case 'active':
      return {
        text: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/30',
      }
    case 'past_due':
      return {
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/30',
      }
    default:
      return {
        text: 'text-muted-foreground',
        bg: 'bg-muted',
      }
  }
}

/**
 * Icon for a subscription status.
 *
 * Picked from the status for the same reason the tone is: the billing card
 * used to hardcode a check mark, so a past_due or canceled subscriber was
 * shown a tick next to the bad news, at exactly the moment they needed a
 * warning instead.
 */
export function subscriptionStatusIcon(
  status: SubscriptionStatus | null | undefined
): LucideIcon {
  switch (status) {
    case 'active':
      return Check
    case 'past_due':
      return AlertTriangle
    case 'canceled':
      return XCircle
    default:
      return CircleHelp
  }
}

// Usage meter color by percentage: green under 80, amber 80-99, red at 100+.
export function usageMeterColor(percentage: number): string {
  if (percentage >= 100) return 'bg-red-500'
  if (percentage >= 80) return 'bg-amber-500'
  return 'bg-green-500'
}
