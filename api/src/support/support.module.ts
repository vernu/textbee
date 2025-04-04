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
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportMessage.name, schema: SupportMessageSchema },
    ]),
    UsersModule,
    BillingModule,
    MailModule,
    AuthModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
