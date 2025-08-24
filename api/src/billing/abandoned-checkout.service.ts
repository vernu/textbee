import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  CheckoutSession,
  CheckoutSessionDocument,
} from './schemas/checkout-session.schema'
import { User, UserDocument } from '../users/schemas/user.schema'
import { MailService } from '../mail/mail.service'
import { BillingService } from './billing.service'

interface EmailConfig {
  template: string
  subject: string
  hoursAfterExpiry: number
  emailType:
    | 'first_reminder'
    | 'second_reminder'
    | 'third_reminder'
    | 'final_reminder'
    | 'last_chance'
}

@Injectable()
export class AbandonedCheckoutService {
  private readonly logger = new Logger(AbandonedCheckoutService.name)

  private readonly emailSchedule: EmailConfig[] = [
    {
      template: 'abandoned-checkout-10-minutes',
      subject: '⏰ Your textbee pro upgrade is waiting!',
      hoursAfterExpiry: -0.167, // 10 minutes before expiry (-10/60 hours)
      emailType: 'first_reminder',
    },
  ]

  constructor(
    @InjectModel(CheckoutSession.name)
    private checkoutSessionModel: Model<CheckoutSessionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private mailService: MailService,
    private billingService: BillingService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processAbandonedCheckouts() {
    this.logger.log('Starting abandoned checkout processing...')

    try {
      for (const emailConfig of this.emailSchedule) {
        await this.sendReminderEmails(emailConfig)
      }
      this.logger.log('Abandoned checkout processing completed successfully')
    } catch (error) {
      this.logger.error('Error processing abandoned checkouts:', error)
    }
  }

  /**
   * Send reminder emails for a specific email configuration
   */
  private async sendReminderEmails(emailConfig: EmailConfig) {
    let windowStart: Date, windowEnd: Date
    let query: any

    if (emailConfig.hoursAfterExpiry < 0) {
      // Before expiry: find sessions that will expire soon
      const targetTime = new Date()
      targetTime.setHours(
        targetTime.getHours() + Math.abs(emailConfig.hoursAfterExpiry),
      )

      windowStart = new Date(targetTime.getTime() - 60 * 60 * 1000) // 1 hour window
      windowEnd = new Date(targetTime.getTime() + 60 * 60 * 1000)

      query = {
        expiresAt: {
          $gte: windowStart,
          $lte: windowEnd,
          $gt: new Date(), // Only send to sessions that haven't expired yet
        },
        'abandonedEmails.emailType': { $ne: emailConfig.emailType },
      }
    } else {
      // After expiry: find sessions that expired the specified time ago
      const targetTime = new Date()
      targetTime.setHours(targetTime.getHours() - emailConfig.hoursAfterExpiry)

      windowStart = new Date(targetTime.getTime() - 60 * 60 * 1000)
      windowEnd = new Date(targetTime.getTime() + 60 * 60 * 1000)

      query = {
        expiresAt: {
          $gte: windowStart,
          $lte: windowEnd,
        },
        'abandonedEmails.emailType': { $ne: emailConfig.emailType },
      }
    }

    const abandonedSessions = await this.checkoutSessionModel
      .find(query)
      .populate('user')
      .limit(100)

    if (abandonedSessions.length === 0) {
      this.logger.debug(
        `No abandoned checkouts found for ${emailConfig.emailType}`,
      )
      return
    }

    this.logger.log(
      `Found ${abandonedSessions.length} abandoned checkouts for ${emailConfig.emailType}`,
    )

    for (const session of abandonedSessions) {
      try {
        // check if user is already on pro plan
        const subscription = await this.billingService.getCurrentSubscription(
          session.user,
        )
        if (subscription.plan.name !== 'free') {
          this.logger.debug(
            `Skipping email for session ${session._id}: user is not on free plan`,
          )
          continue
        }

        await this.sendAbandonedCheckoutEmail(session, emailConfig)

        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        this.logger.error(
          `Failed to send ${emailConfig.emailType} email for session ${session._id}:`,
          error,
        )
      }
    }
  }

  /**
   * Send an individual abandoned checkout email
   */
  private async sendAbandonedCheckoutEmail(
    session: CheckoutSessionDocument,
    emailConfig: EmailConfig,
  ) {
    const user = session.user as UserDocument

    // Skip if user has opted out of marketing emails
    // if (user.marketingEmailsOptOut) {
    //   this.logger.debug(`Skipping email for session ${session._id}: user opted out of marketing emails`)
    //   return
    // }

    try {
      const emailContext = {
        name: user.name?.split(' ')?.[0] || 'there',
        email: user.email,
        checkoutUrl:
          'https://app.textbee.dev/checkout/pro' /*session.checkoutUrl*/,
        planName: this.extractPlanNameFromPayload(session.payload),
        expiresAt: session.expiresAt,
      }

      await this.mailService.sendEmailFromTemplate({
        to: user.email,
        from: 'support@textbee.dev',
        subject: emailConfig.subject,
        template: emailConfig.template,
        context: emailContext,
      })

      await this.checkoutSessionModel.updateOne(
        { _id: session._id },
        {
          $push: {
            abandonedEmails: {
              emailType: emailConfig.emailType,
              sentAt: new Date(),
              emailSubject: emailConfig.subject,
            },
          },
        },
      )

      this.logger.log(
        `Sent ${emailConfig.emailType} email to ${user.email} for session ${session._id}`,
      )
    } catch (error) {
      this.logger.error(`Failed to send abandoned checkout email:`, error)
      throw error
    }
  }

  private extractPlanNameFromPayload(payload: any): string {
    if (payload?.products?.[0]?.name) {
      return payload.products[0].name
    }
    if (payload?.product?.name) {
      return payload.product.name
    }
    if (payload?.planName) {
      return payload.planName
    }
    return 'Pro' // Default fallback
  }

  async markCheckoutCompleted(checkoutSessionId: string) {
    try {
      const result = await this.checkoutSessionModel.updateOne(
        { checkoutSessionId },
        {
          isCompleted: true,
          completedAt: new Date(),
        },
      )

      if (result.matchedCount > 0) {
        this.logger.log(
          `Marked checkout session ${checkoutSessionId} as completed`,
        )
      }
    } catch (error) {
      this.logger.error(`Failed to mark checkout session as completed:`, error)
    }
  }

  /**
   * Mark a checkout session as abandoned (optional - for analytics)
   */
  async markCheckoutAbandoned(checkoutSessionId: string) {
    try {
      const result = await this.checkoutSessionModel.updateOne(
        { checkoutSessionId },
        {
          isAbandoned: true,
        },
      )

      if (result.matchedCount > 0) {
        this.logger.log(
          `Marked checkout session ${checkoutSessionId} as abandoned`,
        )
      }
    } catch (error) {
      this.logger.error(`Failed to mark checkout session as abandoned:`, error)
    }
  }

  async triggerAbandonedCheckoutProcess() {
    this.logger.log('Manually triggering abandoned checkout process...')
    await this.processAbandonedCheckouts()
  }
}
