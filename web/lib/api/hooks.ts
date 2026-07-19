import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { queryKeys } from './query-keys'
import type {
  ApiKey,
  ApiKeyStatusFilter,
  Device,
  GatewayStats,
  Plan,
  Subscription,
  User,
  WebhookNotification,
  WebhookSubscription,
} from './types'

// Most endpoints wrap their payload as { data: ... }; a few (subscription)
// return the object directly. These helpers keep the unwrapping in one place.
const unwrapData = <T>(res: { data: { data: T } }) => res.data.data
const unwrapBody = <T>(res: { data: T }) => res.data

type QueryOpts<T> = Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>

// List endpoints return { data: T[] }. Legacy (not-yet-migrated) components
// cache that raw envelope under the same query key, so these hooks must keep
// the raw shape in the cache and unwrap per-observer via `select` to avoid a
// cache-shape collision on shared keys like ['devices'] and ['webhooks'].
type ListEnvelope<T> = { data: T[] }
type ListQueryOpts<T> = Omit<
  UseQueryOptions<ListEnvelope<T>, Error, T[]>,
  'queryKey' | 'queryFn' | 'select'
>
const selectList = <T>(raw: ListEnvelope<T> | undefined): T[] => raw?.data ?? []

// ---------- account ----------

export function useCurrentUser(options?: QueryOpts<User>) {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () =>
      httpBrowserClient.get(ApiEndpoints.auth.whoAmI()).then(unwrapData<User>),
    ...options,
  })
}

// ---------- billing ----------

export function useSubscription(options?: QueryOpts<Subscription>) {
  return useQuery({
    queryKey: queryKeys.subscription,
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.billing.currentSubscription())
        .then(unwrapBody<Subscription>),
    ...options,
  })
}

export function useBillingPlans(options?: ListQueryOpts<Plan>) {
  return useQuery({
    queryKey: queryKeys.billingPlans,
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.billing.plans())
        .then((r) => r.data as ListEnvelope<Plan>),
    select: selectList<Plan>,
    ...options,
  })
}

// ---------- gateway ----------

export function useGatewayStats(options?: QueryOpts<GatewayStats>) {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.getStats())
        .then(unwrapData<GatewayStats>),
    ...options,
  })
}

export function useDevices(options?: ListQueryOpts<Device>) {
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((r) => r.data as ListEnvelope<Device>),
    select: selectList<Device>,
    ...options,
  })
}

export function useDeleteDevice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      httpBrowserClient.delete(ApiEndpoints.gateway.deleteDevice(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devices })
    },
  })
}

// ---------- api keys ----------

export function useApiKeys(
  status: ApiKeyStatusFilter = 'active',
  options?: ListQueryOpts<ApiKey>
) {
  return useQuery({
    queryKey: queryKeys.apiKeys(status),
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.auth.listApiKeys(status))
        .then((r) => r.data as ListEnvelope<ApiKey>),
    select: selectList<ApiKey>,
    ...options,
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      httpBrowserClient.post(ApiEndpoints.auth.revokeApiKey(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      httpBrowserClient.delete(ApiEndpoints.auth.deleteApiKey(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
  })
}

export function useRenameApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      httpBrowserClient.patch(ApiEndpoints.auth.renameApiKey(id), { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys('active') })
    },
  })
}

// ---------- webhooks ----------

export function useWebhooks(options?: ListQueryOpts<WebhookSubscription>) {
  return useQuery({
    queryKey: queryKeys.webhooks,
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.getWebhooks())
        .then((r) => r.data as ListEnvelope<WebhookSubscription>),
    select: selectList<WebhookSubscription>,
    ...options,
  })
}

export type WebhookNotificationFilters = {
  eventType?: string
  status?: string
  deviceId?: string
  webhookSubscriptionId?: string
  start?: string
  end?: string
  page?: number
  limit?: number
}

// Raw body: { data: { data: rows[], meta: { totalPages, ... } } }
export type WebhookNotificationsEnvelope = {
  data?: {
    data?: WebhookNotification[]
    meta?: { totalPages?: number; total?: number }
  }
}

export function useWebhookNotifications(filters: WebhookNotificationFilters) {
  const {
    eventType = '',
    status = '',
    deviceId = '',
    webhookSubscriptionId = '',
    start = '',
    end = '',
    page = 1,
    limit = 10,
  } = filters
  return useQuery({
    queryKey: [
      'webhook-notification',
      eventType,
      page,
      limit,
      deviceId,
      webhookSubscriptionId,
      status,
    ],
    queryFn: () =>
      httpBrowserClient
        .get(
          `${ApiEndpoints.gateway.getWebhookNotifications()}?eventType=${eventType}&page=${page}&limit=${limit}&status=${status}&start=${start}&end=${end}&deviceId=${deviceId}&webhookSubscriptionId=${webhookSubscriptionId}`
        )
        .then(unwrapBody<WebhookNotificationsEnvelope>),
  })
}

// ---------- messaging ----------

// Matches the zod-inferred SendSmsFormData shape; validation happens via the
// schema before the payload reaches here.
export type SendSmsPayload = {
  // Required: it goes into the request path, so an absent one would POST to
  // /gateway/devices/undefined/send-sms. Both callers validate it first.
  deviceId: string
  recipients?: string[]
  message?: string
  simSubscriptionId?: number
}

export function useSendSms() {
  return useMutation({
    mutationKey: ['send-sms'],
    mutationFn: (data: SendSmsPayload) =>
      httpBrowserClient.post(ApiEndpoints.gateway.sendSMS(data.deviceId), data),
  })
}

export type DeviceMessagesParams = {
  type?: string
  page?: number
  limit?: number
  search?: string
}

export type DeviceMessagesEnvelope = {
  data: unknown[]
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number }
}

// Returns the raw { data, meta } message-history envelope for a device.
// `search` is handled server-side (gateway getMessages matches it against the
// message body, recipient and sender), so it searches all of a device's
// history rather than only the page already loaded.
export function useDeviceMessages(
  deviceId: string,
  params: DeviceMessagesParams = {},
  options?: QueryOpts<DeviceMessagesEnvelope>
) {
  const { type = 'all', page = 1, limit = 20, search = '' } = params
  return useQuery({
    // search joins the key so each term caches separately.
    queryKey: queryKeys.deviceMessages(deviceId, { type, page, limit, search }),
    enabled: !!deviceId,
    queryFn: () => {
      const query = new URLSearchParams({
        type,
        page: String(page),
        limit: String(limit),
      })
      if (search) query.set('search', search)

      return httpBrowserClient
        .get(`${ApiEndpoints.gateway.getMessages(deviceId)}?${query}`)
        .then(unwrapBody<DeviceMessagesEnvelope>)
    },
    ...options,
  })
}
