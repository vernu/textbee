import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { MailService } from '../mail/mail.service'
import {
  BillingNotification,
  BillingNotificationDocument,
} from './schemas/billing-notification.schema'
import { User, UserDocument } from '../users/schemas/user.schema'

@Injectable()
export class BillingNotificationsListener {
  constructor(
    private readonly mailService: MailService,
    @InjectModel(BillingNotification.name)
    private readonly notificationModel: Model<BillingNotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  @OnEvent('billing.notification.created', { async: true })
  async handleCreatedEvent(payload: {
    notificationId: Types.ObjectId
    userId: Types.ObjectId
    type: string
    title: string
    message: string
    meta: Record<string, any>
    createdAt: Date
    sendEmail?: boolean
  }) {
    if (!payload?.sendEmail) {
      return
    }

    const user = await this.userModel.findById(payload.userId)
    if (!user?.email) {
      return
    }

    const html = this.buildEmailHtml({
      name: user.name?.split(' ')?.[0] || 'there',
      title: payload.title,
      message: payload.message,
    })

    await this.mailService.sendEmail({
      to: user.email,
      subject: payload.title,
      html,
      from: undefined,
    })

    await this.notificationModel.updateOne(
      { _id: payload.notificationId },
      { $inc: { sentEmailCount: 1 }, $set: { lastEmailSentAt: new Date() } },
    )
  }

  private buildEmailHtml({
    name,
    title,
    message,
  }: {
    name: string
    title: string
    message: string
  }) {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height:1.6;">
        <h2 style="margin:0 0 8px 0;">${title}</h2>
        <p style="margin:0;">Hi ${name}, ${message}</p>
      </div>
    `
  }
}
