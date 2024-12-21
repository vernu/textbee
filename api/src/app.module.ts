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

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30,
      },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    GatewayModule,
    WebhookModule,
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
