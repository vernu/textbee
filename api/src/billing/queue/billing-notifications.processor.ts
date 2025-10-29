import { Process, Processor } from '@nestjs/bull'
import { InjectModel } from '@nestjs/mongoose'
import { Job } from 'bull'
import { Model, Types } from 'mongoose'
import { MailService } from '../../mail/mail.service'
import { User, UserDocument } from '../../users/schemas/user.schema'
import {
  BillingNotification,
  BillingNotificationDocument,
} from '../schemas/billing-notification.schema'

@Processor('billing-notifications')
export class BillingNotificationsProcessor {
  constructor(
    private readonly mailService: MailService,
    @InjectModel(BillingNotification.name)
    private readonly notificationModel: Model<BillingNotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  @Process({ name: 'send', concurrency: 1 })
  async handleSend(job: Job<{
    notificationId: Types.ObjectId
    userId: Types.ObjectId
    type: string
    title: string
    message: string
    meta: Record<string, any>
    createdAt: Date
    sendEmail?: boolean
  }>) {
    const payload = job.data
    if (!payload?.sendEmail) {
      return
    }

    const user = await this.userModel.findById(payload.userId)
    if (!user?.email) {
      return
    }

    const subject = this.subjectForType(payload.type, payload.title)
    const ctaUrlBase = process.env.FRONTEND_URL || 'https://app.textbee.dev'
    const isEmailVerification = payload.type === 'email_verification_required'
    const ctaUrl = isEmailVerification
      ? `${ctaUrlBase}/dashboard/account`
      : 'https://textbee.dev/#pricing'
    const ctaLabel = isEmailVerification ? 'Verify your email' : 'View plans & pricing'

    await this.mailService.sendEmailFromTemplate({
      to: user.email,
      subject,
      template: 'billing-notification',
      context: {
        name: user.name?.split(' ')?.[0] || 'there',
        title: payload.title,
        message: payload.message,
        ctaLabel,
        ctaUrl,
        brandName: 'textbee.dev',
      },
      from: undefined,
    })

    await this.notificationModel.updateOne(
      { _id: payload.notificationId },
      { $inc: { sentEmailCount: 1 }, $set: { lastEmailSentAt: new Date() } },
    )
  }

  private subjectForType(type: string, fallback: string) {
    switch (type) {
      case 'daily_limit_reached':
        return 'Daily SMS limit reached — action required'
      case 'monthly_limit_reached':
        return 'Monthly SMS limit reached — action required'
      case 'bulk_sms_limit_reached':
        return 'Bulk send limit exceeded'
      case 'daily_limit_approaching':
        return 'Heads up: daily usage nearing your limit'
      case 'monthly_limit_approaching':
        return 'Heads up: monthly usage nearing your limit'
      case 'email_verification_required':
        return 'Verify your email to keep using textbee'
      default:
        return fallback || 'Account notification'
    }
  }
}


