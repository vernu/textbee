import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Device, DeviceSchema } from './schemas/device.schema'
import { GatewayController } from './gateway.controller'
import { GatewayService } from './gateway.service'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { SMS, SMSSchema } from './schemas/sms.schema'
import { SMSBatch, SMSBatchSchema } from './schemas/sms-batch.schema'
import { WebhookModule } from 'src/webhook/webhook.module'
import { BillingModule } from 'src/billing/billing.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Device.name,
        schema: DeviceSchema,
      },
      {
        name: SMS.name,
        schema: SMSSchema,
      },
      {
        name: SMSBatch.name,
        schema: SMSBatchSchema,
      },
    ]),
    AuthModule,
    UsersModule,
    WebhookModule,
    forwardRef(() => BillingModule),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
  exports: [MongooseModule, GatewayService],
})
export class GatewayModule {}
