// Shared response types for the backend API. Kept permissive (most fields
// optional) to match the loosely-typed backend payloads and the project's
// non-strict TS config, while still giving components real autocomplete.

export interface User {
  _id?: string
  id?: string
  name?: string
  email?: string
  phone?: string
  role?: string
  avatar?: string | null
  emailVerifiedAt?: string | null
  onboardingCompletedAt?: string | null
  // Set when the user asks for deletion, which starts a 7-day window. Real
  // field on the user schema, and read by the account-deletion banner, but it
  // was missing from this type.
  accountDeletionRequestedAt?: string | null
}

export interface GatewayStats {
  totalSentSMSCount?: number
  totalReceivedSMSCount?: number
  totalDeviceCount?: number
  totalApiKeyCount?: number
}

export interface Device {
  _id: string
  brand?: string
  model?: string
  enabled?: boolean
  // No `status` field: the Device schema has none and the API never sends one,
  // so `device.status === 'online'` was always false and every device rendered
  // with the muted "inactive" badge even while enabled and working.
  //
  // The device does report real telemetry through its heartbeat (battery,
  // network type, last heartbeat, SIM details) which the API stores and
  // returns. It is deliberately not modelled here yet: surfacing it is a
  // feature, not a fix, and belongs in its own change.
  appVersionCode?: number
  createdAt?: string
}

export interface ApiKey {
  _id: string
  apiKey: string
  name?: string
  status?: 'active' | 'revoked'
  lastUsedAt?: string | null
  createdAt?: string
}

export interface Plan {
  name?: string
  dailyLimit?: number
  monthlyLimit?: number
  bulkSendLimit?: number
  deviceLimit?: number
  // Prices are in cents and live on the plan as monthlyPrice/yearlyPrice.
  // This type previously declared amount/currency/recurringInterval, which the
  // plans endpoint has never sent: those belong to Subscription, populated
  // from the payment provider. Anything reading plan.amount silently saw
  // undefined and rendered a paid plan as free.
  monthlyPrice?: number
  yearlyPrice?: number
  isActive?: boolean
}

export interface SubscriptionUsage {
  dailyLimit?: number
  monthlyLimit?: number
  bulkSendLimit?: number
  deviceLimit?: number
  processedSmsToday?: number
  processedSmsLastMonth?: number
  dailyRemaining?: number
  monthlyRemaining?: number
  dailyUsagePercentage?: number
  monthlyUsagePercentage?: number
}

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | string

export interface Subscription {
  plan?: Plan
  usage?: SubscriptionUsage
  status?: SubscriptionStatus
  amount?: number
  currency?: string
  recurringInterval?: string
  subscriptionStartDate?: string
  currentPeriodEnd?: string
  customDailyLimit?: number | null
  customMonthlyLimit?: number | null
  customBulkSendLimit?: number | null
  customDeviceLimit?: number | null
}

export type ApiKeyStatusFilter = 'active' | 'revoked' | 'all'

export interface WebhookSubscription {
  _id: string
  name?: string
  deliveryUrl?: string
  events?: string[]
  isActive?: boolean
  createdAt?: string
}
