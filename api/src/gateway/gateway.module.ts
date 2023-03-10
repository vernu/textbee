import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Device, DeviceSchema } from './schemas/device.schema'
import { GatewayController } from './gateway.controller'
import { GatewayService } from './gateway.service'
import { AuthModule } from 'src/auth/auth.module'
import { UsersModule } from 'src/users/users.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Device.name,
        schema: DeviceSchema,
      },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
  exports: [MongooseModule, GatewayService],
})
export class GatewayModule {}
