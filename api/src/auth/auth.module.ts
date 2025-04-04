import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { MongooseModule } from '@nestjs/mongoose'
import { PassportModule } from '@nestjs/passport'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { ApiKey, ApiKeySchema } from './schemas/api-key.schema'
import { MailModule } from 'src/mail/mail.module'
import {
  PasswordReset,
  PasswordResetSchema,
} from './schemas/password-reset.schema'
import { AccessLog, AccessLogSchema } from './schemas/access-log.schema'
import { EmailVerification, EmailVerificationSchema } from './schemas/email-verification.schema'
import { AuthGuard } from './guards/auth.guard'
import { OptionalAuthGuard } from './guards/optional-auth.guard'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ApiKey.name,
        schema: ApiKeySchema,
      },
      {
        name: PasswordReset.name,
        schema: PasswordResetSchema,
      },
      {
        name: AccessLog.name,
        schema: AccessLogSchema,
      },
      {
        name: EmailVerification.name,
        schema: EmailVerificationSchema,
      },
    ]),
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '60d' },
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthGuard, OptionalAuthGuard, MongooseModule],
  exports: [AuthService, JwtModule, AuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
