import type { ApiKeyStatusFilter } from './types'

// Single source of truth for react-query cache keys. Values intentionally match
// the ad-hoc string keys used across the app before this refactor (e.g.
// ['devices'], ['currentSubscription'], ['apiKeys', 'active']) so migrated and
// not-yet-migrated components still share the same cache entries.
export const queryKeys = {
  currentUser: ['currentUser'] as const,
  subscription: ['currentSubscription'] as const,
  stats: ['stats'] as const,
  devices: ['devices'] as const,
  webhooks: ['webhooks'] as const,
  billingPlans: ['billingPlans'] as const,
  apiKeys: (status: ApiKeyStatusFilter = 'active') =>
    ['apiKeys', status] as const,
  deviceMessages: (deviceId: string, filters?: Record<string, unknown>) =>
    filters
      ? (['messages', deviceId, filters] as const)
      : (['messages', deviceId] as const),
}
