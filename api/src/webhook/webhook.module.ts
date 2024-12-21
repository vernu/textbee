import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { WebhookController } from './webhook.controller'
import { WebhookService } from './webhook.service'
import {
  WebhookSubscription,
  WebhookSubscriptionSchema,
} from './schemas/webhook-subscription.schema'
import {
  WebhookNotification,
  WebhookNotificationSchema,
} from './schemas/webhook-notification.schema'
import { AuthModule } from 'src/auth/auth.module'
import { UsersModule } from 'src/users/users.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: WebhookSubscription.name,
        schema: WebhookSubscriptionSchema,
      },
      {
        name: WebhookNotification.name,
        schema: WebhookNotificationSchema,
      },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [MongooseModule, WebhookService],
})
export class WebhookModule {}
