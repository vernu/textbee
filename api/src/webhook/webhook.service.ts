import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Model } from 'mongoose'
import {
  WebhookSubscription,
  WebhookSubscriptionDocument,
} from './schemas/webhook-subscription.schema'
import { InjectModel } from '@nestjs/mongoose'
import { WebhookEvent } from './webhook-event.enum'
import {
  WebhookNotification,
  WebhookNotificationDocument,
} from './schemas/webhook-notification.schema'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { Cron } from '@nestjs/schedule'
import * as crypto from 'crypto'
import mongoose from 'mongoose'
import { SMS } from '../gateway/schemas/sms.schema'
import { WebhookQueueService } from './queue/webhook-queue.service'
import { MailService } from '../mail/mail.service'
import { UsersService } from '../users/users.service'

@Injectable()
export class WebhookService {
  constructor(
    @InjectModel(WebhookSubscription.name)
    private webhookSubscriptionModel: Model<WebhookSubscriptionDocument>,
    @InjectModel(WebhookNotification.name)
    private webhookNotificationModel: Model<WebhookNotificationDocument>,
    private webhookQueueService: WebhookQueueService,
    private mailService: MailService,
    private usersService: UsersService,
  ) {}

  async findOne({ user, webhookId }) {
    const webhook = await this.webhookSubscriptionModel.findOne({
      _id: webhookId,
      user: user._id,
    })

    if (!webhook) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND)
    }
    return webhook
  }

  async findWebhooksForUser({ user }) {
    return await this.webhookSubscriptionModel.find({ user: user._id })
  }
  async findWebhookNotificationsForUser({
    user,
    page = 1,
    limit = 10,
    eventType,
    status,
    start,
    end,
    deviceId,
  }): Promise<{ data: any[]; meta: any }> {
    const userWebhookSubscription = await this.webhookSubscriptionModel.findOne(
      {
        user: user._id,
      },
    )

    if (!userWebhookSubscription) {
      return {
        data: [],
        meta: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
      }
    }

    const matchStage: any = { webhookSubscription: userWebhookSubscription._id }

    if (eventType) {
      matchStage.event = eventType
    }

    if (
      start &&
      end &&
      !Number.isNaN(new Date(start).getTime()) &&
      !Number.isNaN(new Date(end).getTime())
    ) {
      matchStage.createdAt = { $gte: new Date(start), $lte: new Date(end) }
    }


    const pageNum = Math.max(1, Number.parseInt(page.toString()) || 1)
    const limitNum = Math.max(1, Number.parseInt(limit.toString()) || 10)
    const skip = (pageNum - 1) * limitNum

    const commonPipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'sms',
          localField: 'sms',
          foreignField: '_id',
          as: 'smsData',
        },
      },
      { $unwind: { path: '$smsData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'devices',
          localField: 'smsData.device',
          foreignField: '_id',
          as: 'deviceData',
        },
      },
      { $unwind: { path: '$deviceData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'webhooksubscriptions',
          localField: 'webhookSubscription',
          foreignField: '_id',
          as: 'webhookSubscriptionData',
        },
      },
      {
        $unwind: {
          path: '$webhookSubscriptionData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          computedStatus: {
            $cond: {
              if: { $ne: ['$deliveredAt', null] },
              then: 'delivered',
              else: {
                $cond: {
                  if: {
                    $or: [
                      { $ne: ['$deliveryAttemptAbortedAt', null] },
                      { $gte: ['$deliveryAttemptCount', 10] }
                    ]
                  },
                  then: 'failed',
                  else: {
                    $cond: {
                      if: {
                        $and: [
                          { $eq: ['$deliveredAt', null] },
                          { $eq: ['$deliveryAttemptAbortedAt', null] },
                          { $gt: ['$deliveryAttemptCount', 0] },
                          { $lt: ['$deliveryAttemptCount', 10] }
                        ]
                      },
                      then: 'retrying',
                      else: 'pending'
                    }
                  }
                }
              }
            }
          }
        }
      },
    ]

    // Apply status filter
    if (status) {
      commonPipeline.push({
        $match: {
          computedStatus: status
        }
      })
    }

    if (deviceId) {
      commonPipeline.push({
        $match: {
          'deviceData._id': new mongoose.Types.ObjectId(deviceId),
        },
      })
    }

    const facetPipeline = [
      ...commonPipeline,
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNum },
          ],
        },
      },
      {
        $project: {
          data: 1,
          totalCount: {
            $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0],
          },
        },
      },
    ]

    const [result] =
      await this.webhookNotificationModel.aggregate(facetPipeline)

    const total = result?.totalCount || 0
    const data = result?.data || []
    const totalPages = Math.ceil(total / limitNum)

    return {
      data,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    }
  }
  async create({ user, createWebhookDto }) {
    const { events, deliveryUrl, signingSecret } = createWebhookDto

    // Add URL validation
    try {
      new URL(deliveryUrl)
    } catch (e) {
      throw new HttpException('Invalid delivery URL', HttpStatus.BAD_REQUEST)
    }

    // validate signing secret
    if (signingSecret.length < 20) {
      throw new HttpException('Invalid signing secret', HttpStatus.BAD_REQUEST)
    }

    const existingSubscription = await this.webhookSubscriptionModel.findOne({
      user: user._id,
      events,
    })

    if (existingSubscription) {
      throw new HttpException(
        'You have already subscribed to this event',
        HttpStatus.BAD_REQUEST,
      )
    }

    if (!events.every((event) => Object.values(WebhookEvent).includes(event))) {
      throw new HttpException('Invalid event type', HttpStatus.BAD_REQUEST)
    }

    // TODO: Encrypt signing secret
    // const webhookSignatureKey = process.env.WEBHOOK_SIGNATURE_KEY
    // const encryptedSigningSecret = encrypt(signingSecret, webhookSignatureKey)

    const webhookSubscription = await this.webhookSubscriptionModel.create({
      user: user._id,
      events,
      deliveryUrl,
      signingSecret,
    })

    return webhookSubscription
  }

  async update({ user, webhookId, updateWebhookDto }) {
    const webhookSubscription = await this.webhookSubscriptionModel.findOne({
      _id: webhookId,
      user: user._id,
    })

    if (!webhookSubscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND)
    }

    if (updateWebhookDto.hasOwnProperty('isActive')) {
      webhookSubscription.isActive = updateWebhookDto.isActive
    }

    if (updateWebhookDto.hasOwnProperty('deliveryUrl')) {
      webhookSubscription.deliveryUrl = updateWebhookDto.deliveryUrl
    }

    // if there is a valid uuid signing secret, update it
    if (
      updateWebhookDto.hasOwnProperty('signingSecret') &&
      updateWebhookDto.signingSecret.length < 20
    ) {
      throw new HttpException('Invalid signing secret', HttpStatus.BAD_REQUEST)
    } else if (updateWebhookDto.hasOwnProperty('signingSecret')) {
      webhookSubscription.signingSecret = updateWebhookDto.signingSecret
    }

    if (
      updateWebhookDto.hasOwnProperty('events') &&
      updateWebhookDto.events.length === 0
    ) {
      throw new HttpException(
        'Choose atleast one event to receive',
        HttpStatus.BAD_REQUEST,
      )
    } else if (updateWebhookDto.hasOwnProperty('events')) {
      webhookSubscription.events = updateWebhookDto.events
    }
    await webhookSubscription.save()

    return webhookSubscription
  }

  async deliverNotification({ sms, user, event }) {
    const webhookSubscription = await this.webhookSubscriptionModel.findOne({
      user: user._id,
      events: { $in: [event] },
      isActive: true,
    })

    if (!webhookSubscription) {
      return
    }
    if (!Object.values(WebhookEvent).includes(event)) {
      throw new HttpException('Invalid event type', HttpStatus.BAD_REQUEST)
    }

    // Generate idempotency key
    const idempotencyKey = uuidv4()

    // Store delivery URL snapshot for debugging
    const deliveryUrlSnapshot = webhookSubscription.deliveryUrl

    let payload: Record<string, any> = {
      smsId: sms._id,
      message: sms.message,
      deviceId: sms.device,
      webhookSubscriptionId: webhookSubscription._id,
      webhookEvent: event,
      idempotencyKey,
    }

    switch (event) {
      case WebhookEvent.MESSAGE_RECEIVED:
        payload = {
          ...payload,
          sender: sms.sender,
          receivedAt: sms.receivedAt,
        }
        break

      case WebhookEvent.MESSAGE_DELIVERED:
        payload = {
          ...payload,
          smsBatchId: sms.smsBatch,
          status: sms.status,
          recipient: sms.recipient,
          sentAt: sms.sentAt,
          deliveredAt: sms.deliveredAt,
        }
        break

      case WebhookEvent.MESSAGE_SENT:
        payload = {
          ...payload,
          smsBatchId: sms.smsBatch,
          status: sms.status,
          recipient: sms.recipient,
          sentAt: sms.sentAt,
        }
        break

      case WebhookEvent.MESSAGE_FAILED:
        payload = {
          ...payload,
          smsBatchId: sms.smsBatch,
          status: sms.status,
          recipient: sms.recipient,
          errorCode: sms.errorCode,
          errorMessage: sms.errorMessage,
          failedAt: sms.failedAt,
        }
        break

      case WebhookEvent.UNKNOWN_STATE:
        payload = {
          ...payload,
          smsBatchId: sms.smsBatch,
          status: sms.status,
          recipient: sms.recipient,
        }
        break
    }

    const webhookNotification = await this.webhookNotificationModel.create({
      webhookSubscription: webhookSubscription._id,
      event,
      payload,
      sms,
      idempotencyKey,
      deliveryUrl: deliveryUrlSnapshot,
    })

    // Queue job instead of synchronous delivery
    await this.webhookQueueService.addWebhookDeliveryJob(
      webhookNotification._id.toString(),
    )
  }

  async attemptWebhookDelivery(notificationId: string) {
    const now = new Date()
    const webhookNotification = await this.webhookNotificationModel.findById(
      notificationId,
    )

    if (!webhookNotification) {
      console.log(`Webhook notification not found for ${notificationId}`)
      return
    }

    const webhookSubscriptionId = webhookNotification.webhookSubscription
    const webhookSubscription = await this.webhookSubscriptionModel.findById(
      webhookSubscriptionId,
    )

    if (!webhookSubscription) {
      console.log(`Webhook subscription not found for ${webhookSubscriptionId}`)
      return
    }

    if (!webhookSubscription.isActive) {
      webhookNotification.deliveryAttemptAbortedAt = now
      await webhookNotification.save()
      console.log(
        `Webhook subscription is not active for ${webhookNotification._id}, aborting delivery`,
      )
      return
    }

    const deliveryUrl = webhookSubscription?.deliveryUrl
    const signingSecret = webhookSubscription?.signingSecret

    const signature = crypto
      .createHmac('sha256', signingSecret)
      .update(JSON.stringify(webhookNotification.payload))
      .digest('hex')

    let httpStatusCode: number | undefined
    let responseBody: string | undefined
    let errorType: 'retryable' | 'non-retryable' | undefined

    const deliveryTimeoutMs = Math.min(
      60000,
      Math.max(10000, parseInt(process.env.WEBHOOK_DELIVERY_TIMEOUT_MS ?? '30000', 10) || 30000),
    )

    try {
      const response = await axios.post(deliveryUrl, webhookNotification.payload, {
        headers: {
          'X-Signature': signature,
        },
        timeout: deliveryTimeoutMs,
      })

      httpStatusCode = response.status
      responseBody = typeof response.data === 'string' 
        ? response.data.substring(0, 1000)
        : JSON.stringify(response.data).substring(0, 1000)

      webhookNotification.deliveryAttemptCount += 1
      webhookNotification.lastDeliveryAttemptAt = now
      webhookNotification.nextDeliveryAttemptAt = this.getNextDeliveryAttemptAt(
        webhookNotification.deliveryAttemptCount,
      )
      webhookNotification.deliveredAt = now
      webhookNotification.httpStatusCode = httpStatusCode
      webhookNotification.responseBody = responseBody
      await webhookNotification.save()

      webhookSubscription.successfulDeliveryCount += 1
      webhookSubscription.lastDeliverySuccessAt = now
      webhookSubscription.deliveryAttemptCount += 1
      await webhookSubscription.save()
    } catch (e) {
      // Classify error type
      if (e.response?.status) {
        httpStatusCode = e.response.status
        responseBody = typeof e.response.data === 'string'
          ? e.response.data.substring(0, 1000)
          : JSON.stringify(e.response.data || {}).substring(0, 1000)

        // 4xx errors are non-retryable, 5xx are retryable
        if (e.response.status >= 400 && e.response.status < 500) {
          errorType = 'non-retryable'
        } else if (e.response.status >= 500) {
          errorType = 'retryable'
        }
      } else {
        // Network/timeout errors are retryable
        errorType = 'retryable'
        responseBody = e.message?.substring(0, 1000)
      }

      webhookNotification.deliveryAttemptCount += 1
      webhookNotification.lastDeliveryAttemptAt = now
      webhookNotification.httpStatusCode = httpStatusCode
      webhookNotification.responseBody = responseBody
      webhookNotification.errorType = errorType

      // For 4xx errors, mark as abandoned after 3rd attempt
      if (errorType === 'non-retryable' && webhookNotification.deliveryAttemptCount >= 3) {
        webhookNotification.deliveryAttemptAbortedAt = now
        webhookNotification.nextDeliveryAttemptAt = undefined
      } else if (errorType === 'retryable' && webhookNotification.deliveryAttemptCount < 10) {
        // For retryable errors, schedule next attempt
        webhookNotification.nextDeliveryAttemptAt = this.getNextDeliveryAttemptAt(
          webhookNotification.deliveryAttemptCount,
        )
      } else {
        // Max attempts reached
        webhookNotification.deliveryAttemptAbortedAt = now
        webhookNotification.nextDeliveryAttemptAt = undefined
      }

      await webhookNotification.save()

      webhookSubscription.deliveryFailureCount += 1
      webhookSubscription.lastDeliveryFailureAt = now
      webhookSubscription.deliveryAttemptCount += 1
      await webhookSubscription.save()

      console.log(
        `Failed to deliver webhook notification: ID ${webhookNotification._id}, status code: ${httpStatusCode}, error type: ${errorType}, message: ${e.message}`,
      )
    }
  }

  private getNextDeliveryAttemptAt(deliveryAttemptCount: number): Date {
    // Delays in minutes after a failed delivery attempt
    const delaySequence = [
      3, // 3 minutes
      5, // 5 minutes
      30, // 30 minutes
      60, // 1 hour
      360, // 6 hours
      1440, // 1 day
      4320, // 3 days
      10080, // 7 days
      43200, // 30 days
    ]

    // Get the delay in minutes (use last value if attempt count exceeds sequence length)
    const delayInMinutes =
      delaySequence[
        Math.min(deliveryAttemptCount - 1, delaySequence.length - 1)
      ] || delaySequence[delaySequence.length - 1]

    // Convert minutes to milliseconds and add to current time
    return new Date(Date.now() + delayInMinutes * 60 * 1000)
  }

  // Check for notifications that need to be delivered every 5 minutes
  @Cron('0 */5 * * * *')
  async checkForNotificationsToDeliver() {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const notifications = await this.webhookNotificationModel
      .find({
        nextDeliveryAttemptAt: { $lte: fiveMinutesAgo },
        deliveredAt: null,
        deliveryAttemptCount: { $lt: 10 },
        deliveryAttemptAbortedAt: null,
      })
      .sort({ nextDeliveryAttemptAt: 1 })
      .limit(200)

    if (notifications.length === 0) {
      return
    }

    console.log(`Queueing ${notifications.length} webhook notifications for retry`)

    for (const notification of notifications) {
      await this.webhookQueueService.addWebhookDeliveryJob(
        notification._id.toString(),
      )
    }
  }

  private getAutoDisableConfig(): {
    threshold: number
    lookbackDays: number
    minFailureRate: number
  } {
    const threshold = Math.max(
      1,
      parseInt(process.env.WEBHOOK_AUTO_DISABLE_FAILURE_THRESHOLD ?? '50', 10) || 50,
    )
    const lookbackDays = Math.max(
      1,
      Math.min(
        365,
        parseInt(process.env.WEBHOOK_AUTO_DISABLE_LOOKBACK_DAYS ?? '30', 10) || 30,
      ),
    )
    const minFailureRate = Math.min(
      1,
      Math.max(
        0.01,
        parseFloat(process.env.WEBHOOK_AUTO_DISABLE_MIN_FAILURE_RATE ?? '0.50') || 0.5,
      ),
    )
    return { threshold, lookbackDays, minFailureRate }
  }

  @Cron('0 6 * * *')
  async autoDisableSubscriptionsWithHighFailureRate() {
    const { threshold, lookbackDays, minFailureRate } = this.getAutoDisableConfig()
    const now = new Date()
    const since = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000)

    const subscriptionCounts = await this.webhookNotificationModel.aggregate<{
      _id: mongoose.Types.ObjectId
      count: number
    }>([
      {
        $addFields: {
          _finalizedAt: {
            $ifNull: ['$lastDeliveryAttemptAt', '$createdAt'],
          },
        },
      },
      {
        $match: {
          deliveredAt: null,
          _finalizedAt: { $gte: since },
          $or: [
            { deliveryAttemptAbortedAt: { $ne: null } },
            { deliveryAttemptCount: { $gte: 10 } },
          ],
        },
      },
      { $group: { _id: '$webhookSubscription', count: { $sum: 1 } } },
      { $match: { count: { $gte: threshold } } },
    ])

    if (subscriptionCounts.length === 0) {
      return
    }

    const subscriptionIds = subscriptionCounts.map((s) => s._id)
    const failureCountBySubscriptionId = new Map(
      subscriptionCounts.map((s) => [s._id.toString(), s.count]),
    )

    const successCounts = await this.webhookNotificationModel.aggregate<{
      _id: mongoose.Types.ObjectId
      count: number
    }>([
      {
        $match: {
          webhookSubscription: { $in: subscriptionIds },
          deliveredAt: { $ne: null, $gte: since },
        },
      },
      { $group: { _id: '$webhookSubscription', count: { $sum: 1 } } },
    ])
    const successCountBySubscriptionId = new Map(
      successCounts.map((s) => [s._id.toString(), s.count]),
    )

    const subscriptionsToDisable: { subscriptionId: string; failureCount: number; successCount: number; totalAttempts: number; failureRatePercent: number }[] = []
    for (const s of subscriptionCounts) {
      const sid = s._id.toString()
      const failureCount = failureCountBySubscriptionId.get(sid) ?? 0
      const successCount = successCountBySubscriptionId.get(sid) ?? 0
      const totalAttempts = failureCount + successCount
      const failureRate = totalAttempts > 0 ? failureCount / totalAttempts : 0
      if (failureRate >= minFailureRate) {
        const failureRatePercent = Math.round(failureRate * 100)
        subscriptionsToDisable.push({
          subscriptionId: sid,
          failureCount,
          successCount,
          totalAttempts,
          failureRatePercent,
        })
      }
    }

    if (subscriptionsToDisable.length === 0) {
      return
    }

    const subscriptionIdSet = new Set(subscriptionsToDisable.map((s) => s.subscriptionId))
    const activeSubscriptions = await this.webhookSubscriptionModel.find({
      _id: { $in: subscriptionIds.filter((id) => subscriptionIdSet.has(id.toString())) },
      isActive: true,
    })

    const ctaUrlBase = process.env.FRONTEND_URL || 'https://app.textbee.dev'
    const disabledInThisRun: {
      subscriptionId: string
      deliveryUrl: string
      failureCount: number
      successCount: number
      totalAttempts: number
      failureRatePercent: number
      lookbackDays: number
      userName: string
      userEmail: string
    }[] = []

    for (const subscription of activeSubscriptions) {
      const stats = subscriptionsToDisable.find(
        (s) => s.subscriptionId === subscription._id.toString(),
      )
      if (!stats) continue

      const { failureCount, successCount, totalAttempts, failureRatePercent } = stats
      const noteText = `Auto-disabled: ${failureCount} failed and ${successCount} succeeded (${totalAttempts} total) in the last ${lookbackDays} days — failure rate ${failureRatePercent}%. Re-enable in dashboard when your endpoint is ready.`
      const noteEntry = { at: new Date(), text: noteText }

      const result = await this.webhookSubscriptionModel.updateOne(
        { _id: subscription._id, isActive: true },
        {
          $set: { isActive: false },
          $push: { notes: noteEntry },
        },
      )

      if (result.modifiedCount === 0) {
        continue
      }

      const user = await this.usersService.findOne({
        _id: subscription.user,
      })

      disabledInThisRun.push({
        subscriptionId: subscription._id.toString(),
        deliveryUrl: subscription.deliveryUrl ?? '',
        failureCount,
        successCount,
        totalAttempts,
        failureRatePercent,
        lookbackDays,
        userName: user?.name ?? '—',
        userEmail: user?.email ?? '—',
      })

      if (!user?.email) {
        console.log(
          `Webhook subscription ${subscription._id} auto-disabled but no user/email to notify`,
        )
        continue
      }

      try {
        await this.mailService.sendEmailFromTemplate({
          to: user.email,
          subject: 'Webhook subscription disabled – textbee',
          template: 'webhook-subscription-disabled',
          context: {
            name: user.name?.split(' ')?.[0] || 'there',
            title: 'Webhook subscription disabled',
            message: `Your webhook had ${failureCount} failed and ${successCount} succeeded (${totalAttempts} total) in the last ${lookbackDays} days — failure rate was ${failureRatePercent}%. It was automatically disabled. Re-enable it in the dashboard when your endpoint is ready.`,
            failureCount,
            successCount,
            totalAttempts,
            failureRatePercent,
            lookbackDays,
            ctaUrl: `${ctaUrlBase}/dashboard/account`,
            ctaLabel: 'View webhooks',
            brandName: 'textbee.dev',
          },
        })
      } catch (e) {
        console.log(
          `Failed to send webhook-disabled email to ${user.email}:`,
          e,
        )
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL
    if (disabledInThisRun.length > 0 && adminEmail) {
      const runAt = now.toISOString()
      try {
        await this.mailService.sendEmailFromTemplate({
          to: adminEmail,
          subject: `Webhook auto-disable: ${disabledInThisRun.length} subscription(s) – ${runAt.slice(0, 10)}`,
          template: 'webhook-auto-disable-admin-summary',
          context: {
            title: 'Webhook auto-disable summary',
            runAt,
            count: disabledInThisRun.length,
            disabledList: disabledInThisRun,
            brandName: 'textbee.dev',
          },
        })
      } catch (e) {
        console.log(`Failed to send webhook auto-disable admin summary to ${adminEmail}:`, e)
      }
    }
  }
}
