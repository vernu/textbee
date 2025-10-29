import { Module, forwardRef } from '@nestjs/common'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'
import { AbandonedCheckoutService } from './abandoned-checkout.service'
import { PlanSchema } from './schemas/plan.schema'
import { SubscriptionSchema } from './schemas/subscription.schema'
import { Plan } from './schemas/plan.schema'
import { Subscription } from './schemas/subscription.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from 'src/auth/auth.module'
import { UsersModule } from 'src/users/users.module'
import { GatewayModule } from 'src/gateway/gateway.module'
import { MailModule } from 'src/mail/mail.module'
import { PolarWebhookPayload, PolarWebhookPayloadSchema } from './schemas/polar-webhook-payload.schema'
import { Device, DeviceSchema } from '../gateway/schemas/device.schema'
import { CheckoutSession, CheckoutSessionSchema } from './schemas/checkout-session.schema'
import { BillingNotification, BillingNotificationSchema } from './schemas/billing-notification.schema'
import { BillingNotificationsService } from './billing-notifications.service'
import { BillingNotificationsListener } from './billing-notifications.listener'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: PolarWebhookPayload.name, schema: PolarWebhookPayloadSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: CheckoutSession.name, schema: CheckoutSessionSchema },
      { name: BillingNotification.name, schema: BillingNotificationSchema },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => GatewayModule),
    MailModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, AbandonedCheckoutService, BillingNotificationsService, BillingNotificationsListener],
  exports: [BillingService, AbandonedCheckoutService, BillingNotificationsService],
})
export class BillingModule {}
