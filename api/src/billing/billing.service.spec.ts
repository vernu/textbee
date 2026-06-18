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
      ],
    }).compile()

    service = module.get<BillingService>(BillingService)

    jest.clearAllMocks()
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
