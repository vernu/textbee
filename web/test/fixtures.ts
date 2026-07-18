// Shared, framework-agnostic API fixtures used by BOTH the MSW node server
// (unit/component tests) and the Playwright route-interception layer (e2e).
// These mirror the response envelopes the real backend returns, as consumed
// across the dashboard components. Tests must never hit a live backend, so
// these are the single source of truth for mocked API data.

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'

export const TEST_ACCESS_TOKEN = 'test-access-token'

export const mockUser = {
  _id: 'user_test_1',
  id: 'user_test_1',
  name: 'Test User',
  email: 'test.user@example.com',
  phone: '+15551234567',
  role: 'user',
  avatar: null,
  emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  onboardingCompletedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
}

export const mockStats = {
  totalSentSMSCount: 12840,
  totalReceivedSMSCount: 3120,
  totalDeviceCount: 2,
  totalApiKeyCount: 3,
}

export const mockSubscription = {
  plan: {
    name: 'Pro',
    dailyLimit: 5000,
    monthlyLimit: 100000,
    bulkSendLimit: 1000,
    deviceLimit: 5,
  },
  usage: {
    dailyLimit: 5000,
    monthlyLimit: 100000,
    bulkSendLimit: 1000,
    deviceLimit: 5,
    processedSmsToday: 320,
    processedSmsLastMonth: 18450,
    dailyRemaining: 4680,
    monthlyRemaining: 81550,
    dailyUsagePercentage: 6.4,
    monthlyUsagePercentage: 18.45,
  },
  status: 'active',
  amount: 1900,
  currency: 'usd',
  recurringInterval: 'month',
  subscriptionStartDate: new Date('2026-06-01T00:00:00.000Z').toISOString(),
  currentPeriodEnd: new Date('2026-08-01T00:00:00.000Z').toISOString(),
  customDailyLimit: null,
  customMonthlyLimit: null,
  customBulkSendLimit: null,
  customDeviceLimit: null,
}

export const mockDevices = [
  {
    _id: 'device_1',
    brand: 'Google',
    model: 'Pixel 8',
    enabled: true,
    batteryLevel: 82,
    appVersionCode: 17,
    createdAt: new Date('2026-05-10T00:00:00.000Z').toISOString(),
  },
  {
    _id: 'device_2',
    brand: 'Samsung',
    model: 'Galaxy S23',
    enabled: false,
    batteryLevel: 40,
    appVersionCode: 16,
    createdAt: new Date('2026-05-20T00:00:00.000Z').toISOString(),
  },
]

export const mockApiKeys = [
  {
    _id: 'key_1',
    apiKey: 'tb_live_abcd1234',
    name: 'Production',
    status: 'active',
    lastUsedAt: new Date('2026-07-09T00:00:00.000Z').toISOString(),
    createdAt: new Date('2026-05-01T00:00:00.000Z').toISOString(),
  },
]

export const mockWebhooks = [
  {
    _id: 'wh_1',
    deliveryUrl: 'https://example.com/webhooks/textbee',
    events: ['message.received'],
    isActive: true,
    createdAt: new Date('2026-06-15T00:00:00.000Z').toISOString(),
  },
]

export const mockWebhookNotifications = { data: [], total: 0 }

// The real endpoint populates `device` (select: _id brand model buildId
// enabled), so the fixtures carry it too: replying reads message.device._id,
// and without it the mocked path would not exercise what production does.
// Anchored to local midnight rather than "N hours ago": a message 2 hours old
// falls on the previous day when the suite runs just after midnight, which
// made the Today/Yesterday grouping assertions depend on the wall clock.
const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
// Now is always today and never in the future.
const todayIso = () => new Date().toISOString()
// An hour before local midnight is always yesterday.
const yesterdayIso = () => new Date(startOfToday() - 60 * 60 * 1000).toISOString()

export const mockMessages = {
  data: [
    {
      _id: 'msg_1',
      recipient: '+15557654321',
      message: 'Hello from textbee',
      status: 'sent',
      type: 'sent',
      device: { _id: 'device_1', brand: 'Google', model: 'Pixel 8' },
      requestedAt: todayIso(),
      createdAt: todayIso(),
    },
    {
      _id: 'msg_2',
      sender: '+15551234567',
      message: 'Reply from a customer',
      status: 'received',
      type: 'received',
      device: { _id: 'device_1', brand: 'Google', model: 'Pixel 8' },
      receivedAt: yesterdayIso(),
      createdAt: yesterdayIso(),
    },
  ],
  meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
}

export const mockBillingPlans = [
  { name: 'Free', amount: 0, currency: 'usd', recurringInterval: 'month' },
  { name: 'Pro', amount: 1900, currency: 'usd', recurringInterval: 'month' },
  { name: 'Scale', amount: 4900, currency: 'usd', recurringInterval: 'month' },
]
