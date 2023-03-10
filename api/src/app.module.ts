import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
