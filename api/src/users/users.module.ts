import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from './schemas/user.schema'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { BillingModule } from 'src/billing/billing.module'
import { Device, DeviceSchema } from 'src/gateway/schemas/device.schema'
import { MailModule } from 'src/mail/mail.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Device.name,
        schema: DeviceSchema,
      },
    ]),
    forwardRef(() => BillingModule),
    MailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [MongooseModule, UsersService],
})
export class UsersModule {}
