import { Module, forwardRef } from '@nestjs/common'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'
import { PlanSchema } from './schemas/plan.schema'
import { SubscriptionSchema } from './schemas/subscription.schema'
import { Plan } from './schemas/plan.schema'
import { Subscription } from './schemas/subscription.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from 'src/auth/auth.module'
import { UsersModule } from 'src/users/users.module'
import { GatewayModule } from 'src/gateway/gateway.module'
import { PolarWebhookPayload, PolarWebhookPayloadSchema } from './schemas/polar-webhook-payload.schema'
import { Device, DeviceSchema } from '../gateway/schemas/device.schema'
import { CheckoutSession, CheckoutSessionSchema } from './schemas/checkout-session.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: PolarWebhookPayload.name, schema: PolarWebhookPayloadSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: CheckoutSession.name, schema: CheckoutSessionSchema },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => GatewayModule),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
