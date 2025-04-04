import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Plan, PlanDocument } from './schemas/plan.schema'
import {
  Subscription,
  SubscriptionDocument,
} from './schemas/subscription.schema'
import { Polar } from '@polar-sh/sdk'
import { User, UserDocument } from '../users/schemas/user.schema'
import { CheckoutResponseDTO, PlanDTO } from './billing.dto'
import { SMSDocument } from '../gateway/schemas/sms.schema'
import { SMS } from '../gateway/schemas/sms.schema'
import { validateEvent } from '@polar-sh/sdk/webhooks'
import {
  PolarWebhookPayload,
  PolarWebhookPayloadDocument,
} from './schemas/polar-webhook-payload.schema'

@Injectable()
export class BillingService {
  private polarApi

  constructor(
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SMS.name) private smsModel: Model<SMSDocument>,
    @InjectModel(PolarWebhookPayload.name)
    private polarWebhookPayloadModel: Model<PolarWebhookPayloadDocument>,
  ) {
    this.polarApi = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
      server:
        process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox',
    })
  }

  async getPlans(): Promise<PlanDTO[]> {
    return this.planModel.find({
      isActive: true,
    })
  }

  async getCurrentSubscription(user: any) {
    const subscription = await this.subscriptionModel
      .findOne({
        user: user._id,
        isActive: true,
      })
      .populate('plan')

    if (subscription) {
      return subscription
    }

    const plan = await this.planModel.findOne({ name: 'free' })

    return {
      plan,
      isActive: true,
    }
  }

  async getCheckoutUrl({
    user,
    payload,
    req,
  }: {
    user: any
    payload: any
    req: any
  }): Promise<CheckoutResponseDTO> {
    const isYearly = payload.isYearly

    const selectedPlan = await this.planModel.findOne({
      name: payload.planName,
    })

    if (
      !selectedPlan?.polarMonthlyProductId &&
      !selectedPlan?.polarYearlyProductId
    ) {
      throw new Error('Plan cannot be purchased')
    }

    // const product = await this.polarApi.products.get(selectedPlan.polarProductId)

    const discountId =
      payload.discountId ?? '48f62ff7-3cd8-46ec-8ca7-2e570dc9c522'

    try {
      const checkoutOptions: any = {
        // productId: selectedPlan.polarProductId, // deprecated
        products: [
          selectedPlan.polarMonthlyProductId,
          selectedPlan.polarYearlyProductId,
        ],
        successUrl: `${process.env.FRONTEND_URL}/dashboard?checkout-success=1&checkout_id={CHECKOUT_ID}`,
        cancelUrl: `${process.env.FRONTEND_URL}/dashboard?checkout-cancel=1&checkout_id={CHECKOUT_ID}`,
        customerEmail: user.email,
        customerName: user.name,
        customerIpAddress: req.ip,
        metadata: {
          userId: user._id?.toString(),
        },
      }
      const discount = await this.polarApi.discounts.get({
        id: discountId,
      })
      if (discount) {
        checkoutOptions.discountId = discount.id
      }

      const checkout = await this.polarApi.checkouts.create(checkoutOptions)
      console.log(checkout)
      return { redirectUrl: checkout.url }
    } catch (error) {
      console.error(error)
      throw new Error('Failed to create checkout')
    }
  }

  async getActiveSubscription(userId: string) {
    const user = await this.userModel.findById(new Types.ObjectId(userId))
    const plans = await this.planModel.find()

    const customPlans = plans.filter((plan) => plan.name?.startsWith('custom'))
    const proPlan = plans.find((plan) => plan.name === 'pro')
    const freePlan = plans.find((plan) => plan.name === 'free')

    const customPlanSubscription = await this.subscriptionModel.findOne({
      user: user._id,
      plan: { $in: customPlans.map((plan) => plan._id) },
      isActive: true,
    })

    if (customPlanSubscription) {
      return customPlanSubscription.populate('plan')
    }

    const proPlanSubscription = await this.subscriptionModel.findOne({
      user: user._id,
      plan: proPlan._id,
      isActive: true,
    })

    if (proPlanSubscription) {
      return proPlanSubscription.populate('plan')
    }

    const freePlanSubscription = await this.subscriptionModel.findOne({
      user: user._id,
      plan: freePlan._id,
      isActive: true,
    })

    if (freePlanSubscription) {
      return freePlanSubscription.populate('plan')
    }

    // create a new free plan subscription
    // const newFreePlanSubscription = await this.subscriptionModel.create({
    //   user: user._id,
    //   plan: freePlan._id,
    //   isActive: true,
    //   startDate: new Date(),
    // })

    // return newFreePlanSubscription.populate('plan')
    return {
      user,
      plan: freePlan,
      isActive: true,
      status: 'active',
      amount: 0,
    }
  }

  async getUserLimits(userId: string) {
    const subscription = await this.subscriptionModel
      .findOne({ user: new Types.ObjectId(userId), isActive: true })
      .populate('plan')

    if (!subscription) {
      // Default to free plan limits
      const freePlan = await this.planModel.findOne({ name: 'free' })
      return {
        dailyLimit: freePlan.dailyLimit,
        monthlyLimit: freePlan.monthlyLimit,
        bulkSendLimit: freePlan.bulkSendLimit,
      }
    }

    // For custom plans, use custom limits if set
    return {
      dailyLimit: subscription.customDailyLimit || subscription.plan.dailyLimit,
      monthlyLimit:
        subscription.customMonthlyLimit || subscription.plan.monthlyLimit,
      bulkSendLimit:
        subscription.customBulkSendLimit || subscription.plan.bulkSendLimit,
    }
  }

  async switchPlan({
    userId,
    newPlanName,
    newPlanPolarProductId,
    currentPeriodStart,
    currentPeriodEnd,
    subscriptionStartDate,
    subscriptionEndDate,
    status,
    amount,
    currency,
    recurringInterval,
  }: {
    userId: string
    newPlanName?: string
    newPlanPolarProductId?: string
    createdAt?: Date
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
    subscriptionStartDate?: Date
    subscriptionEndDate?: Date
    status?: string
    amount?: number
    currency?: string
    recurringInterval?: string
  }) {
    console.log(`Switching plan for user: ${userId}`)

    // Convert userId to ObjectId
    const userObjectId = new Types.ObjectId(userId)

    let plan: PlanDocument
    if (newPlanPolarProductId) {
      plan = await this.planModel.findOne({
        $or: [
          // { polarProductId: newPlanPolarProductId }, // deprecated
          { polarMonthlyProductId: newPlanPolarProductId },
          { polarYearlyProductId: newPlanPolarProductId },
        ],
      })
    } else if (newPlanName) {
      plan = await this.planModel.findOne({ name: newPlanName })
    }

    if (!plan) {
      throw new Error('Plan not found')
    }

    console.log(`Found plan: ${plan.name}`)

    // Deactivate current active subscriptions
    const result = await this.subscriptionModel.updateMany(
      { user: userObjectId, plan: { $ne: plan._id }, isActive: true },
      { isActive: false, subscriptionEndDate: new Date() },
    )
    console.log(`Deactivated subscriptions: ${result.modifiedCount}`)

    // Create or update the new subscription
    const updateResult = await this.subscriptionModel.updateOne(
      { user: userObjectId, plan: plan._id },
      {
        isActive: true,
        currentPeriodStart,
        currentPeriodEnd,
        subscriptionStartDate,
        subscriptionEndDate,
        status,
        amount,
        currency,
        recurringInterval,
      },
      { upsert: true },
    )
    console.log(
      `Updated or created subscription: ${updateResult.upsertedCount > 0 ? 'Created' : 'Updated'}`,
    )

    return { success: true, plan: plan.name }
  }

  async canPerformAction(
    userId: string,
    action: 'send_sms' | 'receive_sms' | 'bulk_send_sms',
    value: number,
  ) {
    try {
      const user = await this.userModel.findById(userId)
      if (user.isBanned) {
        throw new HttpException(
          {
            message: 'Sorry, we cannot process your request at the moment',
          },
          HttpStatus.BAD_REQUEST,
        )
      }

      if (user.emailVerifiedAt === null) {
        console.error('canPerformAction: User email not verified')
        throw new HttpException(
          {
            message: 'Please verify your email to continue',
          },
          HttpStatus.BAD_REQUEST,
        )
      }

      let plan: PlanDocument
      const subscription = await this.subscriptionModel.findOne({
        user,
        isActive: true,
      })

      if (!subscription) {
        plan = await this.planModel.findOne({ name: 'free' })
      } else {
        plan = await this.planModel.findById(subscription.plan)
      }

      if (plan.name?.startsWith('custom')) {
        // TODO: for now custom plans are unlimited
        return true
      }

      let hasReachedLimit = false
      let message = ''

      const processedSmsToday = await this.smsModel.countDocuments({
        'device.user': userId,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      })
      const processedSmsLastMonth = await this.smsModel.countDocuments({
        'device.user': userId,
        createdAt: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      })

      if (['send_sms', 'receive_sms', 'bulk_send_sms'].includes(action)) {
        // check daily limit
        if (
          plan.dailyLimit !== -1 &&
          processedSmsToday + value > plan.dailyLimit
        ) {
          hasReachedLimit = true
          message = `You have reached your daily limit, you only have ${plan.dailyLimit - processedSmsToday} remaining`
        }

        // check monthly limit
        if (
          plan.monthlyLimit !== -1 &&
          processedSmsLastMonth + value > plan.monthlyLimit
        ) {
          hasReachedLimit = true
          message = `You have reached your monthly limit, you only have ${plan.monthlyLimit - processedSmsLastMonth} remaining`
        }

        // check bulk send limit
        if (plan.bulkSendLimit !== -1 && value > plan.bulkSendLimit) {
          hasReachedLimit = true
          message = `You can only send ${plan.bulkSendLimit} sms at a time`
        }
      }

      if (hasReachedLimit) {
        console.error('canPerformAction: hasReachedLimit')
        console.error(
          JSON.stringify({
            userId,
            userEmail: user.email,
            userName: user.name,
            action,
            value,
            message,
            hasReachedLimit: true,
            dailyLimit: plan.dailyLimit,
            dailyRemaining: plan.dailyLimit - processedSmsToday,
            monthlyRemaining: plan.monthlyLimit - processedSmsLastMonth,
            bulkSendLimit: plan.bulkSendLimit,
            monthlyLimit: plan.monthlyLimit,
          }),
        )

        throw new HttpException(
          {
            message: message,
            hasReachedLimit: true,
            dailyLimit: plan.dailyLimit,
            dailyRemaining: plan.dailyLimit - processedSmsToday,
            monthlyRemaining: plan.monthlyLimit - processedSmsLastMonth,
            bulkSendLimit: plan.bulkSendLimit,
            monthlyLimit: plan.monthlyLimit,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      return true
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        throw error
      }
      console.error('canPerformAction: Exception in canPerformAction')
      console.error(JSON.stringify(error))
      return true
    }
  }

  async getUsage(userId: string) {
    const subscription = await this.subscriptionModel.findOne({
      user: userId,
      isActive: true,
    })

    const plan = await this.planModel.findById(subscription.plan)

    const processedSmsToday = await this.smsModel.countDocuments({
      'device.user': userId,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })

    const processedSmsLastMonth = await this.smsModel.countDocuments({
      'device.user': userId,
      createdAt: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    })

    return {
      processedSmsToday,
      processedSmsLastMonth,
      dailyLimit: plan.dailyLimit,
      monthlyLimit: plan.monthlyLimit,
      bulkSendLimit: plan.bulkSendLimit,
      dailyRemaining: plan.dailyLimit - processedSmsToday,
      monthlyRemaining: plan.monthlyLimit - processedSmsLastMonth,
    }
  }

  async validatePolarWebhookPayload(payload: any, headers: any) {
    const webhookHeaders = {
      'webhook-id': headers['webhook-id'] ?? '',
      'webhook-timestamp': headers['webhook-timestamp'] ?? '',
      'webhook-signature': headers['webhook-signature'] ?? '',
    }
    try {
      const webhookPayload = validateEvent(
        payload,
        webhookHeaders,
        process.env.POLAR_WEBHOOK_SECRET,
      )
      return webhookPayload
    } catch (error) {
      console.log('failed to validate polar webhook payload')
      console.error(error)
      throw new Error('Invalid webhook payload')
    }
  }

  async storePolarWebhookPayload(payload: any) {
    const userId = payload.data?.metadata?.userId || payload.data?.userId
    const eventType = payload.type
    const name = payload.data?.customer?.name || payload.data?.customerName
    const email = payload.data?.customer?.email || payload.data?.customerEmail
    const productId = payload.data?.product?.id || payload.data?.productId
    const productName = payload.data?.product?.name || payload.data?.productName

    await this.polarWebhookPayloadModel.create({
      userId,
      eventType,
      name,
      email,
      payload,
      productId,
      productName,
    })
  }
}
