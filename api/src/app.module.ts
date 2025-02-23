import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { GatewayModule } from './gateway/gateway.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core/constants'
import { WebhookModule } from './webhook/webhook.module'
import { ThrottlerByIpGuard } from './auth/guards/throttle-by-ip.guard'
import { ScheduleModule } from '@nestjs/schedule'
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    GatewayModule,
    WebhookModule,
    BillingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerByIpGuard,
    },
  ],
})
export class AppModule {}
