import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { GatewayModule } from './gateway/gateway.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    AuthModule,
    UsersModule,
    GatewayModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
