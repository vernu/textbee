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
import { CronExpression } from '@nestjs/schedule'
import * as crypto from 'crypto'

@Injectable()
export class WebhookService {
  constructor(
    @InjectModel(WebhookSubscription.name)
    private webhookSubscriptionModel: Model<WebhookSubscriptionDocument>,
    @InjectModel(WebhookNotification.name)
    private webhookNotificationModel: Model<WebhookNotificationDocument>,
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

    if (event === WebhookEvent.MESSAGE_RECEIVED) {
      const payload = {
        smsId: sms._id,
        sender: sms.sender,
        message: sms.message,
        receivedAt: sms.receivedAt,
        deviceId: sms.device,
        webhookSubscriptionId: webhookSubscription._id,
        webhookEvent: event,
      }
      const webhookNotification = await this.webhookNotificationModel.create({
        webhookSubscription: webhookSubscription._id,
        event,
        payload,
        sms,
      })

      await this.attemptWebhookDelivery(webhookNotification)
    } else {
      throw new HttpException('Invalid event type', HttpStatus.BAD_REQUEST)
    }
  }

  private async attemptWebhookDelivery(
    webhookNotification: WebhookNotificationDocument,
  ) {
    const now = new Date()
    const webhookSubscriptionId = webhookNotification.webhookSubscription

    const webhookSubscription = await this.webhookSubscriptionModel.findById(
      webhookSubscriptionId,
    )

    if (!webhookSubscription) {
      console.log(
        `Webhook subscription not found for ${webhookSubscriptionId}`,
      )
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

    try {
      await axios.post(deliveryUrl, webhookNotification.payload, {
        headers: {
          'X-Signature': signature,
        },
        timeout: 10000,
      })
      webhookNotification.deliveryAttemptCount += 1
      webhookNotification.lastDeliveryAttemptAt = now
      webhookNotification.nextDeliveryAttemptAt = this.getNextDeliveryAttemptAt(
        webhookNotification.deliveryAttemptCount,
      )
      webhookNotification.deliveredAt = now
      await webhookNotification.save()

      webhookSubscription.successfulDeliveryCount += 1
      webhookSubscription.lastDeliverySuccessAt = now
    } catch (e) {
      console.log(
        `Failed to deliver webhook notification: ID ${webhookNotification._id}, status code: ${e.response?.status}, message: ${e.message}`,
      )
      webhookNotification.deliveryAttemptCount += 1
      webhookNotification.lastDeliveryAttemptAt = now
      webhookNotification.nextDeliveryAttemptAt = this.getNextDeliveryAttemptAt(
        webhookNotification.deliveryAttemptCount,
      )
      await webhookNotification.save()

      webhookSubscription.deliveryFailureCount += 1
      webhookSubscription.lastDeliveryFailureAt = now

    } finally {
      webhookSubscription.deliveryAttemptCount += 1
      await webhookSubscription.save()
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

  // Check for notifications that need to be delivered every 3 minutes
  @Cron('0 */3 * * * *', {
    disabled: process.env.NODE_ENV !== 'production'
  })
  async checkForNotificationsToDeliver() {
    const now = new Date()
    const notifications = await this.webhookNotificationModel
      .find({
        nextDeliveryAttemptAt: { $lte: now },
        deliveredAt: null,
        deliveryAttemptCount: { $lt: 10 },
        deliveryAttemptAbortedAt: null,
      })
      .sort({ nextDeliveryAttemptAt: 1 })
      .limit(30)

    if (notifications.length === 0) {
      return
    }

    console.log(`delivering ${notifications.length} webhook notifications`)

    for (const notification of notifications) {
      await this.attemptWebhookDelivery(notification)
    }
  }
}
