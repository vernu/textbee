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
  status?: string
  batteryLevel?: number
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
  amount?: number
  currency?: string
  recurringInterval?: string
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
