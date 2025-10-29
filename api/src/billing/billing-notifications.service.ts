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
    const recent = await this.findRecentSimilar(userId, type)
    if (recent) {
      return recent
    }

    const created = await this.createNotification(userId, type, title, message, meta)

    await this.billingQueue.add(
      'send',
      {
        notificationId: created._id,
        userId: created.user,
        type: created.type,
        title: created.title,
        message: created.message,
        meta: created.meta,
        createdAt: created.createdAt,
        sendEmail,
      },
      {
        delay: 30000,
        attempts: 3,
        removeOnComplete: true,
        backoff: { type: 'exponential', delay: 2000 },
      },
    )

    return created
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

  private async findRecentSimilar(userId: Types.ObjectId | string, type: BillingNotificationType) {
    const since = new Date(Date.now() - this.getDedupeWindowMs(type))
    return this.notificationModel.findOne({
      user: new Types.ObjectId(userId),
      type,
      createdAt: { $gte: since },
    })
  }

  private async createNotification(
    userId: Types.ObjectId | string,
    type: BillingNotificationType,
    title: string,
    message: string,
    meta: Record<string, any>,
  ) {
    return this.notificationModel.create({
      user: new Types.ObjectId(userId),
      type,
      title,
      message,
      meta,
    })
  }

}

export { BillingNotificationType }


