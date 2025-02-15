import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Plan, PlanDocument } from './schemas/plan.schema'
import {
  Subscription,
  SubscriptionDocument,
} from './schemas/subscription.schema'
import { Polar } from '@polar-sh/sdk'
import { User, UserDocument } from 'src/users/schemas/user.schema'
import { CheckoutResponseDTO, PlanDTO } from './billing.dto'
import { SMSDocument } from 'src/gateway/schemas/sms.schema'
import { SMS } from 'src/gateway/schemas/sms.schema'
import { validateEvent } from '@polar-sh/sdk/webhooks'

@Injectable()
export class BillingService {
  private polarApi

  constructor(
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SMS.name) private smsModel: Model<SMSDocument>,
  ) {
    this.initializePlans()
    this.polarApi = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
      server:
        process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox',
    })
  }

  private async initializePlans() {
    const plans = await this.planModel.find()
    if (plans.length === 0) {
      await this.planModel.create([
        {
          name: 'free',
          dailyLimit: 50,
          monthlyLimit: 1000,
          bulkSendLimit: 50,
          monthlyPrice: 0,
          yearlyPrice: 0,
        },
        {
          name: 'pro',
          dailyLimit: -1, // -1 means unlimited
          monthlyLimit: 5000,
          bulkSendLimit: -1,
          monthlyPrice: 690, // $6.90
          yearlyPrice: 6900, // $69.00
        },
        {
          name: 'custom',
          dailyLimit: -1,
          monthlyLimit: -1,
          bulkSendLimit: -1,
          monthlyPrice: 0, // Custom pricing
          yearlyPrice: 0, // Custom pricing
        },
      ])
    }
  }

  async getPlans(): Promise<PlanDTO[]> {
    return this.planModel.find({
      isActive: true,
    })
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

    if (!selectedPlan?.polarProductId) {
      throw new Error('Plan cannot be purchased')
    }

    // const product = await this.polarApi.products.get(selectedPlan.polarProductId)

    const discountId =
      payload.discountId ?? '48f62ff7-3cd8-46ec-8ca7-2e570dc9c522'

    try {
      const checkoutOptions: any = {
        productId: selectedPlan.polarProductId,
        // productPriceId: isYearly
        //   ? selectedPlan.yearlyPolarProductId
        //   : selectedPlan.monthlyPolarProductId,
        successUrl: `${process.env.FRONTEND_URL}/checkout-success?checkout_id={CHECKOUT_ID}`,
        cancelUrl: `${process.env.FRONTEND_URL}/checkout-cancel?checkout_id={CHECKOUT_ID}`,
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

      const checkout =
        await this.polarApi.checkouts.custom.create(checkoutOptions)
      console.log(checkout)
      return { redirectUrl: checkout.url }
    } catch (error) {
      console.error(error)
      throw new Error('Failed to create checkout')
    }
  }

  async getActiveSubscription(userId: string) {
    const user = await this.userModel.findById(userId)
    const plans = await this.planModel.find()

    const customPlan = plans.find((plan) => plan.name === 'custom')
    const proPlan = plans.find((plan) => plan.name === 'pro')
    const freePlan = plans.find((plan) => plan.name === 'free')

    const customPlanSubscription = await this.subscriptionModel.findOne({
      user: userId,
      plan: customPlan._id,
      isActive: true,
    })

    if (customPlanSubscription) {
      return customPlanSubscription
    }

    const proPlanSubscription = await this.subscriptionModel.findOne({
      user: userId,
      plan: proPlan._id,
      isActive: true,
    })

    if (proPlanSubscription) {
      return proPlanSubscription
    }

    const freePlanSubscription = await this.subscriptionModel.findOne({
      user: userId,
      plan: freePlan._id,
      isActive: true,
    })

    if (freePlanSubscription) {
      return freePlanSubscription
    }

    // create a new free plan subscription
    const newFreePlanSubscription = await this.subscriptionModel.create({
      user: userId,
      plan: freePlan._id,
      isActive: true,
      startDate: new Date(),
    })

    return newFreePlanSubscription
  }

  async getUserLimits(userId: string) {
    const subscription = await this.subscriptionModel
      .findOne({ user: userId, isActive: true })
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
  }: {
    userId: string
    newPlanName?: string
    newPlanPolarProductId?: string
  }) {
    // switch the subscription to the new one
    // deactivate the current active subscription
    // activate the new subscription if it exists or create a new one

    // get the plan from the polarProductId
    let plan: PlanDocument
    if (newPlanPolarProductId) {
      plan = await this.planModel.findOne({
        polarProductId: newPlanPolarProductId,
      })
    } else if (newPlanName) {
      plan = await this.planModel.findOne({ name: newPlanName })
    }

    if (!plan) {
      throw new Error('Plan not found')
    }

    // if any of the subscriptions that are not the new plan are active, deactivate them
    await this.subscriptionModel.updateMany(
      { user: userId, plan: { $ne: plan._id }, isActive: true },
      { isActive: false, endDate: new Date() },
    )

    // create or update the new subscription
    await this.subscriptionModel.updateOne(
      { user: userId, plan: plan._id },
      { isActive: true },
      { upsert: true },
    )
  }

  async canPerformAction(
    userId: string,
    action: 'send_sms' | 'receive_sms' | 'bulk_send_sms',
    value: number,
  ) {

    

    // TODO: temporary allow all requests until march 15 2025
    if (new Date() < new Date('2025-03-15')) {
      return true
    }

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
      // throw new HttpException(
      //   {
      //     message: 'Please verify your email to continue',
      //   },
      //   HttpStatus.BAD_REQUEST,
      // )
    }

    let plan: PlanDocument
    const subscription = await this.subscriptionModel.findOne({
      user: userId,
      isActive: true,
    })
    
    if (!subscription) {
      plan = await this.planModel.findOne({ name: 'free' })
    } else {
      plan = await this.planModel.findById(subscription.plan)
    }

    if (plan.name === 'custom') {
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
        HttpStatus.BAD_REQUEST,
      )
    }

    return true
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
      throw new Error('Invalid webhook payload')
    }
  }
}
