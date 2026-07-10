import { http, HttpResponse } from 'msw'
import { ApiEndpoints } from '@/config/api'
import {
  API_BASE_URL,
  mockApiKeys,
  mockBillingPlans,
  mockDevices,
  mockMessages,
  mockStats,
  mockSubscription,
  mockUser,
  mockWebhookNotifications,
  mockWebhooks,
  TEST_ACCESS_TOKEN,
} from '../fixtures'

// Build an absolute URL for an ApiEndpoints path so MSW can match the
// axios baseURL-prefixed requests the app issues.
const url = (path: string) => `${API_BASE_URL}${path.split('?')[0]}`

// Envelope helpers matching the real API's response shapes.
const dataEnvelope = (data: unknown) => HttpResponse.json({ data })
const raw = (body: unknown) => HttpResponse.json(body)

export const handlers = [
  // --- auth ---
  http.get(url(ApiEndpoints.auth.whoAmI()), () => dataEnvelope(mockUser)),
  http.post(url(ApiEndpoints.auth.login()), () =>
    dataEnvelope({ user: mockUser, accessToken: TEST_ACCESS_TOKEN })
  ),
  http.post(url(ApiEndpoints.auth.register()), () =>
    dataEnvelope({ user: mockUser, accessToken: TEST_ACCESS_TOKEN })
  ),
  http.post(url(ApiEndpoints.auth.signInWithGoogle()), () =>
    dataEnvelope({ user: mockUser, accessToken: TEST_ACCESS_TOKEN })
  ),
  http.get(url(ApiEndpoints.auth.listApiKeys()), () =>
    dataEnvelope(mockApiKeys)
  ),
  http.post(url('/auth/api-keys'), () =>
    dataEnvelope({ ...mockApiKeys[0], apiKey: 'tb_live_new0000' })
  ),

  // --- gateway ---
  http.get(url(ApiEndpoints.gateway.listDevices()), () =>
    dataEnvelope(mockDevices)
  ),
  http.get(url(ApiEndpoints.gateway.getStats()), () =>
    dataEnvelope(mockStats)
  ),
  http.get(url(ApiEndpoints.gateway.getWebhooks()), () =>
    dataEnvelope(mockWebhooks)
  ),
  http.get(url(ApiEndpoints.gateway.getWebhookNotifications()), () =>
    raw(mockWebhookNotifications)
  ),

  // --- billing ---
  http.get(url(ApiEndpoints.billing.currentSubscription()), () =>
    raw(mockSubscription)
  ),
  http.get(url(ApiEndpoints.billing.plans()), () =>
    dataEnvelope(mockBillingPlans)
  ),

  // Per-device message history (id is dynamic).
  http.get(`${API_BASE_URL}/gateway/devices/:id/messages`, () =>
    raw(mockMessages)
  ),
  http.get(`${API_BASE_URL}/gateway/devices/:id/get-received-sms`, () =>
    raw(mockMessages)
  ),
]
