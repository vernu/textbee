import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { Model, Types } from 'mongoose'
import {
  BillingNotification,
  BillingNotificationDocument,
  BillingNotificationSchema,
  BillingNotificationType,
} from './schemas/billing-notification.schema'

type NotifyOnceInput = {
  userId: Types.ObjectId | string
  type: BillingNotificationType
  title: string
  message: string
  meta?: Record<string, any>
  sendEmail?: boolean
}

@Injectable()
export class BillingNotificationsService {
  constructor(
    @InjectModel(BillingNotification.name)
    private readonly notificationModel: Model<BillingNotificationDocument>,
    @InjectQueue('billing-notifications') private readonly billingQueue: Queue,
  ) {}

  async notifyOnce({ userId, type, title, message, meta = {}, sendEmail = true }: NotifyOnceInput) {
    const windowMs = this.getDedupeWindowMs(type)
    const existing = await this.notificationModel.findOne({
      user: new Types.ObjectId(userId),
      type,
    })

    if (existing) {
      const lastSentAt = existing.lastEmailSentAt || existing.createdAt
      if (lastSentAt && lastSentAt.getTime() >= Date.now() - windowMs) {
        return existing
      }
    }

    const updated = await this.notificationModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId), type },
      { $set: { title, message, meta }, $setOnInsert: { user: new Types.ObjectId(userId), type } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    await this.billingQueue.add(
      'send',
      {
        notificationId: updated._id,
        userId: updated.user,
        type: updated.type,
        title: updated.title,
        message: updated.message,
        meta: updated.meta,
        createdAt: updated.createdAt,
        sendEmail,
      },
      {
        delay: 30000,
        attempts: 3,
        removeOnComplete: true,
        backoff: { type: 'exponential', delay: 2000 },
        jobId: updated._id.toString(),
      },
    )

    return updated
  }

  async listForUser(userId: Types.ObjectId | string, { limit = 50 } = {}) {
    return this.notificationModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
  }

  private getDedupeWindowMs(type: BillingNotificationType) {
    const hours = {
      [BillingNotificationType.EMAIL_VERIFICATION_REQUIRED]: 24,
      [BillingNotificationType.DAILY_LIMIT_REACHED]: 12,
      [BillingNotificationType.MONTHLY_LIMIT_REACHED]: 48,
      [BillingNotificationType.BULK_SMS_LIMIT_REACHED]: 12,
      [BillingNotificationType.DAILY_LIMIT_APPROACHING]: 24,
      [BillingNotificationType.MONTHLY_LIMIT_APPROACHING]: 48,
    }[type]

    return hours * 60 * 60 * 1000
  }

  // upsert-based single-document per user+type; dedupe controlled by window

}

export { BillingNotificationType }


