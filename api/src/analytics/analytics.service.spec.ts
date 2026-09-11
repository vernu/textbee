import { AnalyticsService } from './analytics.service'

describe('AnalyticsService', () => {
  const originalEnv = process.env
  const metaCapi = { send: jest.fn().mockResolvedValue(undefined) }
  let service: AnalyticsService

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    service = new AnalyticsService(metaCapi as any)
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  const user = {
    _id: 'user-1',
    email: 'ada@example.com',
    attribution: {
      first: { fbclid: 'first-click', at: new Date(1000) },
      last: { fbclid: 'last-click', at: new Date(2000) },
      fbp: 'fb.1.2000.9',
    },
  }

  describe('with no providers configured', () => {
    beforeEach(() => {
      delete process.env.ANALYTICS_PROVIDERS
    })

    it('sends nothing anywhere, which is the self-host default', () => {
      service.userRegistered(user)
      service.checkoutStarted(user, 'pro')
      service.purchase(user, { amount: 1200, currency: 'usd' })

      expect(metaCapi.send).not.toHaveBeenCalled()
    })

    it('stays silent for an empty or unrelated list too', () => {
      process.env.ANALYTICS_PROVIDERS = ''
      service.userRegistered(user)
      process.env.ANALYTICS_PROVIDERS = 'something-else'
      service.userRegistered(user)

      expect(metaCapi.send).not.toHaveBeenCalled()
    })
  })

  describe('with meta enabled', () => {
    beforeEach(() => {
      process.env.ANALYTICS_PROVIDERS = 'meta'
    })

    it('reports a registration with the browser context', () => {
      service.userRegistered(user, { ip: '203.0.113.4', userAgent: 'agent' })

      expect(metaCapi.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CompleteRegistration',
          user: expect.objectContaining({
            userId: 'user-1',
            email: 'ada@example.com',
            ip: '203.0.113.4',
            userAgent: 'agent',
          }),
        }),
      )
    })

    it('prefers the last click id, which is the one closest to the sale', () => {
      service.userRegistered(user)

      expect(metaCapi.send).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ fbclid: 'last-click' }),
        }),
      )
    })

    it('falls back to the first click id when the last visit had none', () => {
      service.userRegistered({
        _id: 'user-2',
        attribution: { first: { fbclid: 'only-click' }, last: {} },
      })

      expect(metaCapi.send).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ fbclid: 'only-click' }),
        }),
      )
    })

    it('converts cents to a currency amount for a purchase', () => {
      service.purchase(user, {
        amount: 1200,
        currency: 'usd',
        plan: 'pro',
        subscriptionId: 'sub_1',
      })

      expect(metaCapi.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Purchase',
          idSuffix: 'sub_1',
          customData: expect.objectContaining({
            value: 12,
            currency: 'USD',
            content_name: 'pro',
          }),
        }),
      )
    })

    it('sends no browser context for a purchase, which comes from a webhook', () => {
      service.purchase(user, { amount: 1200, currency: 'usd' })

      const sent = metaCapi.send.mock.calls[0][0]
      expect(sent.user.ip).toBeUndefined()
      expect(sent.user.userAgent).toBeUndefined()
    })

    it('names the plan on a checkout', () => {
      service.checkoutStarted(user, 'scale')

      expect(metaCapi.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'InitiateCheckout',
          customData: { content_name: 'scale' },
        }),
      )
    })

    it('swallows a failure so a signup never breaks on an ad platform', async () => {
      metaCapi.send.mockRejectedValueOnce(new Error('Meta is down'))

      expect(() => service.userRegistered(user)).not.toThrow()
      await new Promise((resolve) => setImmediate(resolve))
    })
  })
})
