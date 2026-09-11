import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { Types } from 'mongoose'
import { BillingService } from './billing.service'
import { Plan } from './schemas/plan.schema'
import { Subscription } from './schemas/subscription.schema'
import { User } from '../users/schemas/user.schema'
import { SMS } from '../gateway/schemas/sms.schema'
import { PolarWebhookPayload } from './schemas/polar-webhook-payload.schema'
import { CheckoutSession } from './schemas/checkout-session.schema'
import { BillingNotificationsService } from './billing-notifications.service'
import { UsersService } from '../users/users.service'
import { AnalyticsService } from '../analytics/analytics.service'

describe('BillingService - cancellation handling', () => {
  let service: BillingService

  // 24-hex string so `new Types.ObjectId(userId)` succeeds.
  const userId = '507f1f77bcf86cd799439011'
  const proPlan = { _id: 'plan_pro', name: 'pro' }
  const polarProductId = 'prod_pro_monthly'

  const mockPlanModel = {
    findOne: jest.fn(),
  }
  const mockSubscriptionModel = {
    updateOne: jest.fn(),
  }
  const emptyModel = {}
  const mockBillingNotifications = {}
  const mockUsersService = { markMilestone: jest.fn() }
  const mockAnalyticsService = {
    userRegistered: jest.fn(),
    checkoutStarted: jest.fn(),
    purchase: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getModelToken(Plan.name), useValue: mockPlanModel },
        {
          provide: getModelToken(Subscription.name),
          useValue: mockSubscriptionModel,
        },
        { provide: getModelToken(User.name), useValue: emptyModel },
        { provide: getModelToken(SMS.name), useValue: emptyModel },
        {
          provide: getModelToken(PolarWebhookPayload.name),
          useValue: emptyModel,
        },
        {
          provide: getModelToken(CheckoutSession.name),
          useValue: emptyModel,
        },
        {
          provide: BillingNotificationsService,
          useValue: mockBillingNotifications,
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile()

    service = module.get<BillingService>(BillingService)

    jest.clearAllMocks()
    mockUsersService.markMilestone.mockResolvedValue(false)
    mockPlanModel.findOne.mockResolvedValue(proPlan)
    mockSubscriptionModel.updateOne.mockResolvedValue({ modifiedCount: 1 })
  })

  describe('cancelSubscription', () => {
    it('records the scheduled cancellation WITHOUT downgrading (keeps the plan active)', async () => {
      const currentPeriodEnd = new Date('2026-07-17T00:00:00.000Z')

      await service.cancelSubscription({
        userId,
        polarProductId,
        cancelAtPeriodEnd: true,
        currentPeriodEnd,
        status: 'active',
      })

      expect(mockSubscriptionModel.updateOne).toHaveBeenCalledTimes(1)
      const [filter, update] = mockSubscriptionModel.updateOne.mock.calls[0]

      // Filter targets the user's active subscription for this plan.
      expect(filter).toEqual({
        user: expect.any(Types.ObjectId),
        plan: proPlan._id,
        isActive: true,
      })

      // The fix: the cancellation is recorded with the real period end, and
      // the subscription stays active. It must NOT flip isActive to false.
      expect(update).toEqual({
        cancelAtPeriodEnd: true,
        currentPeriodEnd,
        subscriptionEndDate: currentPeriodEnd,
        status: 'active',
      })
      expect(update).not.toHaveProperty('isActive')
    })

    it('defaults cancelAtPeriodEnd to true and omits period fields when not provided', async () => {
      await service.cancelSubscription({ userId, polarProductId })

      const [, update] = mockSubscriptionModel.updateOne.mock.calls[0]
      expect(update).toEqual({ cancelAtPeriodEnd: true })
      expect(update).not.toHaveProperty('currentPeriodEnd')
      expect(update).not.toHaveProperty('subscriptionEndDate')
      expect(update).not.toHaveProperty('isActive')
    })

    it('throws when no plan matches the Polar product id', async () => {
      mockPlanModel.findOne.mockResolvedValue(null)

      await expect(
        service.cancelSubscription({ userId, polarProductId: 'unknown' }),
      ).rejects.toThrow('No plan found for product ID: unknown')
      expect(mockSubscriptionModel.updateOne).not.toHaveBeenCalled()
    })
  })

  describe('revokeSubscription', () => {
    it('performs the real downgrade by deactivating the subscription', async () => {
      await service.revokeSubscription({ userId, polarProductId })

      expect(mockSubscriptionModel.updateOne).toHaveBeenCalledTimes(1)
      const [filter, update] = mockSubscriptionModel.updateOne.mock.calls[0]

      expect(filter).toEqual({
        user: expect.any(Types.ObjectId),
        plan: proPlan._id,
        isActive: true,
      })
      expect(update.isActive).toBe(false)
      expect(update.subscriptionEndDate).toBeInstanceOf(Date)
    })

    it('throws when no plan matches the Polar product id', async () => {
      mockPlanModel.findOne.mockResolvedValue(null)

      await expect(
        service.revokeSubscription({ userId, polarProductId: 'unknown' }),
      ).rejects.toThrow('No plan found for product ID: unknown')
      expect(mockSubscriptionModel.updateOne).not.toHaveBeenCalled()
    })
  })
})

// Pins apart three failures that used to share one misleading message.
describe('BillingService - checkout guards', () => {
  let service: BillingService

  const user = { _id: new Types.ObjectId('507f1f77bcf86cd799439011') }
  const req = { ip: '127.0.0.1' }

  const mockPlanModel = {
    findOne: jest.fn(),
  }
  const emptyModel = {}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getModelToken(Plan.name), useValue: mockPlanModel },
        { provide: getModelToken(Subscription.name), useValue: emptyModel },
        { provide: getModelToken(User.name), useValue: emptyModel },
        { provide: getModelToken(SMS.name), useValue: emptyModel },
        {
          provide: getModelToken(PolarWebhookPayload.name),
          useValue: emptyModel,
        },
        { provide: getModelToken(CheckoutSession.name), useValue: emptyModel },
        { provide: BillingNotificationsService, useValue: {} },
        { provide: UsersService, useValue: { markMilestone: jest.fn() } },
        { provide: AnalyticsService, useValue: { purchase: jest.fn(), checkoutStarted: jest.fn() } },
      ],
    }).compile()

    service = module.get<BillingService>(BillingService)
    jest.clearAllMocks()
  })

  it('names the real problem when the request carries no plan name', async () => {
    await expect(
      service.getCheckoutUrl({
        user,
        payload: { billingInterval: 'monthly' },
        req,
      }),
    ).rejects.toMatchObject({
      response: { code: 'PLAN_NAME_REQUIRED' },
    })

    // the plan is never looked up, so it can never be blamed
    expect(mockPlanModel.findOne).not.toHaveBeenCalled()
  })

  it('reports an unknown plan as not found, not as unpurchasable', async () => {
    mockPlanModel.findOne.mockResolvedValue(null)

    await expect(
      service.getCheckoutUrl({
        user,
        payload: { planName: 'enterprise', billingInterval: 'monthly' },
        req,
      }),
    ).rejects.toMatchObject({
      response: { code: 'PLAN_NOT_FOUND' },
    })
  })

  it('still rejects a real plan that has no Polar products', async () => {
    mockPlanModel.findOne.mockResolvedValue({ name: 'pro' })

    await expect(
      service.getCheckoutUrl({
        user,
        payload: { planName: 'pro', billingInterval: 'monthly' },
        req,
      }),
    ).rejects.toThrow('Plan cannot be purchased')
  })
})

describe('BillingService - syncCheckoutSessionStatus', () => {
  let service: BillingService

  const mockCheckoutSessionModel = {
    updateOne: jest.fn(),
  }
  const emptyModel = {}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getModelToken(Plan.name), useValue: emptyModel },
        { provide: getModelToken(Subscription.name), useValue: emptyModel },
        { provide: getModelToken(User.name), useValue: emptyModel },
        { provide: getModelToken(SMS.name), useValue: emptyModel },
        {
          provide: getModelToken(PolarWebhookPayload.name),
          useValue: emptyModel,
        },
        {
          provide: getModelToken(CheckoutSession.name),
          useValue: mockCheckoutSessionModel,
        },
        { provide: BillingNotificationsService, useValue: {} },
        { provide: UsersService, useValue: { markMilestone: jest.fn() } },
        { provide: AnalyticsService, useValue: { purchase: jest.fn(), checkoutStarted: jest.fn() } },
      ],
    }).compile()

    service = module.get<BillingService>(BillingService)

    jest.clearAllMocks()
    mockCheckoutSessionModel.updateOne.mockResolvedValue({ modifiedCount: 1 })
  })

  // Nothing wrote isCompleted before this existed, so a checkout the customer
  // had already paid for stayed reusable until it expired.
  it('marks a succeeded checkout completed', async () => {
    await service.syncCheckoutSessionStatus({
      checkoutSessionId: 'checkout_abc',
      status: 'succeeded',
    })

    expect(mockCheckoutSessionModel.updateOne).toHaveBeenCalledWith(
      { checkoutSessionId: 'checkout_abc' },
      expect.objectContaining({ isCompleted: true, completedAt: expect.any(Date) }),
    )
  })

  it('marks an expired checkout abandoned', async () => {
    await service.syncCheckoutSessionStatus({
      checkoutSessionId: 'checkout_abc',
      status: 'expired',
    })

    expect(mockCheckoutSessionModel.updateOne).toHaveBeenCalledWith(
      { checkoutSessionId: 'checkout_abc' },
      { isAbandoned: true },
    )
  })

  // open and confirmed are still in flight and failed is retryable, so the
  // cached checkout URL has to stay usable.
  it.each(['open', 'confirmed', 'failed'])(
    'leaves a %s checkout untouched',
    async (status) => {
      await service.syncCheckoutSessionStatus({
        checkoutSessionId: 'checkout_abc',
        status,
      })

      expect(mockCheckoutSessionModel.updateOne).not.toHaveBeenCalled()
    },
  )

  // The cache holds one row per user, so a late webhook for a checkout that has
  // since been replaced must match nothing rather than clobber the new row.
  it('keys on the checkout id, never on the user', async () => {
    await service.syncCheckoutSessionStatus({
      checkoutSessionId: 'checkout_stale',
      status: 'succeeded',
    })

    const [filter] = mockCheckoutSessionModel.updateOne.mock.calls[0]
    expect(filter).toEqual({ checkoutSessionId: 'checkout_stale' })
    expect(filter).not.toHaveProperty('user')
  })

  it('ignores an event with no checkout id', async () => {
    await service.syncCheckoutSessionStatus({
      checkoutSessionId: undefined as any,
      status: 'succeeded',
    })

    expect(mockCheckoutSessionModel.updateOne).not.toHaveBeenCalled()
  })

  // A webhook handler that throws would make Polar retry the whole event.
  it('does not throw when the write fails', async () => {
    mockCheckoutSessionModel.updateOne.mockRejectedValue(new Error('db down'))

    await expect(
      service.syncCheckoutSessionStatus({
        checkoutSessionId: 'checkout_abc',
        status: 'succeeded',
      }),
    ).resolves.not.toThrow()
  })
})

/*
 * Reporting a sale to an ad platform more than once teaches it to bid on the
 * wrong thing, so the first-payment event has to survive the shapes Polar
 * actually sends: created then active for one signup, an upgrade that creates a
 * second subscription row, a renewal, and a re-subscribe after a revoke.
 */
describe('BillingService - first payment reporting', () => {
  let service: BillingService

  const userId = '507f1f77bcf86cd799439011'
  const proPlan = { _id: 'plan_pro', name: 'pro' }

  const mockPlanModel = { findOne: jest.fn() }
  const mockSubscriptionModel = { updateMany: jest.fn(), updateOne: jest.fn() }
  const mockUserModel = { findById: jest.fn() }
  const mockUsersService = { markMilestone: jest.fn() }
  const mockAnalyticsService = { purchase: jest.fn(), checkoutStarted: jest.fn() }
  const emptyModel = {}

  const activePayment = {
    userId,
    newPlanName: 'pro',
    status: 'active',
    amount: 1200,
    currency: 'usd',
    polarSubscriptionId: 'sub_1',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getModelToken(Plan.name), useValue: mockPlanModel },
        {
          provide: getModelToken(Subscription.name),
          useValue: mockSubscriptionModel,
        },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(SMS.name), useValue: emptyModel },
        {
          provide: getModelToken(PolarWebhookPayload.name),
          useValue: emptyModel,
        },
        { provide: getModelToken(CheckoutSession.name), useValue: emptyModel },
        { provide: BillingNotificationsService, useValue: {} },
        { provide: UsersService, useValue: mockUsersService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile()

    service = module.get<BillingService>(BillingService)

    jest.clearAllMocks()
    mockPlanModel.findOne.mockResolvedValue(proPlan)
    mockSubscriptionModel.updateMany.mockResolvedValue({ modifiedCount: 0 })
    mockSubscriptionModel.updateOne.mockResolvedValue({ upsertedCount: 1 })
    mockUserModel.findById.mockResolvedValue({
      _id: userId,
      email: 'ada@example.com',
    })
    mockUsersService.markMilestone.mockResolvedValue(true)
  })

  it('reports the sale the first time an account pays', async () => {
    await service.switchPlan(activePayment)

    expect(mockUsersService.markMilestone).toHaveBeenCalledWith(
      userId,
      'firstPaidAt',
    )
    expect(mockAnalyticsService.purchase).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ada@example.com' }),
      expect.objectContaining({
        amount: 1200,
        currency: 'usd',
        plan: 'pro',
        subscriptionId: 'sub_1',
      }),
    )
  })

  it('reports nothing on a renewal, an upgrade, or a re-subscribe', async () => {
    // The milestone is already stamped, so every later payment is a no-op
    // regardless of whether the subscription row was created or updated.
    mockUsersService.markMilestone.mockResolvedValue(false)

    mockSubscriptionModel.updateOne.mockResolvedValue({ upsertedCount: 0 })
    await service.switchPlan(activePayment)

    // An upgrade creates a second {user, plan} row, which upsertedCount would
    // have treated as a brand new sale.
    mockSubscriptionModel.updateOne.mockResolvedValue({ upsertedCount: 1 })
    await service.switchPlan({ ...activePayment, newPlanName: 'scale' })

    expect(mockAnalyticsService.purchase).not.toHaveBeenCalled()
  })

  it('ignores a subscription that is not active yet', async () => {
    // subscription.created can arrive before the card is charged.
    await service.switchPlan({ ...activePayment, status: 'incomplete' })
    await service.switchPlan({ ...activePayment, status: 'trialing' })

    expect(mockUsersService.markMilestone).not.toHaveBeenCalled()
    expect(mockAnalyticsService.purchase).not.toHaveBeenCalled()
  })

  it('ignores an event that carries no money', async () => {
    await service.switchPlan({ ...activePayment, amount: undefined })
    await service.switchPlan({ ...activePayment, amount: 0 })

    expect(mockUsersService.markMilestone).not.toHaveBeenCalled()
    expect(mockAnalyticsService.purchase).not.toHaveBeenCalled()
  })

  it('still switches the plan when reporting fails', async () => {
    mockUsersService.markMilestone.mockRejectedValue(new Error('mongo down'))

    await expect(service.switchPlan(activePayment)).resolves.toEqual({
      success: true,
      plan: 'pro',
    })
  })
})
