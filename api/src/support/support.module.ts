import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import {
  SupportMessage,
  SupportMessageSchema,
} from './schemas/support-message.schema'
import { SupportService } from './support.service'
import { SupportController } from './support.controller'
import { UsersModule } from 'src/users/users.module'
import { BillingModule } from 'src/billing/billing.module'
import { MailModule } from 'src/mail/mail.module'
import { AuthModule } from 'src/auth/auth.module'
import { Subscription, SubscriptionSchema } from 'src/billing/schemas/subscription.schema'
import { CommonModule } from '../common/common.module'
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportMessage.name, schema: SupportMessageSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    UsersModule,
    BillingModule,
    MailModule,
    AuthModule,
    CommonModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
