import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  AbandonedEmailType,
  CheckoutSession,
  CheckoutSessionDocument,
} from './schemas/checkout-session.schema'
import { User, UserDocument } from '../users/schemas/user.schema'
import { MailService } from '../mail/mail.service'
import { BillingService } from './billing.service'
import { Plan } from './schemas/plan.schema'

interface EmailConfig {
  template: string
  subject: string
  minutesAfterCreation: number
  emailType: AbandonedEmailType
}

@Injectable()
export class AbandonedCheckoutService {
  private readonly logger = new Logger(AbandonedCheckoutService.name)

  private readonly emailSchedule: EmailConfig[] = [
    {
      template: 'abandoned-checkout-10-minutes',
      subject: 'Your TextBee checkout is still open',
      minutesAfterCreation: 10,
      emailType: 'first_reminder',
    },
    {
      template: 'abandoned-checkout-1-hour',
      subject: "Here's what TextBee Pro actually gets you",
      minutesAfterCreation: 60,
      emailType: 'second_reminder',
    },
    {
      template: 'abandoned-checkout-24-hours',
      subject: 'Is TextBee Pro worth $10/month?',
      minutesAfterCreation: 24 * 60,
      emailType: 'third_reminder',
    },
    {
      template: 'abandoned-checkout-3-days',
      subject: 'A quick question from the TextBee founder',
      minutesAfterCreation: 3 * 24 * 60,
      emailType: 'fourth_reminder',
    },
    {
      template: 'abandoned-checkout-7-days',
      subject: 'TextBee Free vs Pro — the full comparison',
      minutesAfterCreation: 7 * 24 * 60,
      emailType: 'final_reminder',
    },
    {
      template: 'abandoned-checkout-14-days',
      subject: 'Closing the loop on your TextBee Pro interest',
      minutesAfterCreation: 14 * 24 * 60,
      emailType: 'last_chance',
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
   * Send reminder emails for a specific email configuration.
   * Timing is based on createdAt so it is independent of session expiry.
   */
  private async sendReminderEmails(emailConfig: EmailConfig) {
    const now = new Date()
    const targetCreatedAt = new Date(now.getTime() - emailConfig.minutesAfterCreation * 60 * 1000)
    const windowMs = 10 * 60 * 1000 // ±10 min window — safe for a cron that runs every 10 min

    const abandonedSessions = await this.checkoutSessionModel
      .find({
        createdAt: {
          $gte: new Date(targetCreatedAt.getTime() - windowMs),
          $lte: new Date(targetCreatedAt.getTime() + windowMs),
        },
        isCompleted: { $ne: true },
        'abandonedEmails.emailType': { $ne: emailConfig.emailType },
      })
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
        if ((subscription?.plan as Plan)?.name !== 'free') {
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
