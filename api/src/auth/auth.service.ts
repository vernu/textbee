import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { InjectModel } from '@nestjs/mongoose'
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema'
import { Model } from 'mongoose'
import { User } from '../users/schemas/user.schema'
import axios from 'axios'
import {
  PasswordReset,
  PasswordResetDocument,
} from './schemas/password-reset.schema'
import { MailService } from 'src/mail/mail.service'
import { RequestResetPasswordInputDTO, ResetPasswordInputDTO } from './auth.dto'
import { AccessLog } from './schemas/access-log.schema'
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
    @InjectModel(PasswordReset.name)
    private passwordResetModel: Model<PasswordResetDocument>,
    @InjectModel(AccessLog.name) private accessLogModel: Model<AccessLog>,
    private readonly mailService: MailService,
  ) {}

  async login(userData: any) {
    const user = await this.usersService.findOne({ email: userData.email })
    if (!user) {
      throw new HttpException(
        { error: 'Invalid credentials' },
        HttpStatus.UNAUTHORIZED,
      )
    }

    if (!(await bcrypt.compare(userData.password, user.password))) {
      throw new HttpException(
        { error: 'Invalid credentials' },
        HttpStatus.UNAUTHORIZED,
      )
    }

    user.lastLoginAt = new Date()
    await user.save()

    const payload = { email: user.email, sub: user._id }
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    }
  }

  async loginWithGoogle(idToken: string) {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    )

    const { sub: googleId, name, email, picture } = response.data
    let user = await this.usersService.findOne({ email })

    if (!user) {
      user = await this.usersService.create({
        name,
        email,
      })
      this.mailService.sendEmailFromTemplate({
        to: user.email,
        subject: 'Welcome to TextBee - Lets get started!',
        template: 'welcome-1',
        context: { name: user.name },
        from: 'vernu vernu@textbee.dev',
      })
    }

    if (user.googleId !== googleId) {
      user.googleId = googleId
    }

    if (user.name !== name) {
      user.name = name
    }

    if (user.avatar !== picture) {
      user.avatar = picture
    }

    user.lastLoginAt = new Date()
    await user.save()

    const payload = { email: user.email, sub: user._id }
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    }
  }

  async register(userData: any) {
    const existingUser = await this.usersService.findOne({
      email: userData.email,
    })
    if (existingUser) {
      throw new HttpException(
        { error: 'User already exists, please login instead' },
        HttpStatus.BAD_REQUEST,
      )
    }

    this.validateEmail(userData.email)
    this.validatePassword(userData.password)

    const hashedPassword = await bcrypt.hash(userData.password, 10)
    const user = await this.usersService.create({
      ...userData,
      password: hashedPassword,
    })

    user.lastLoginAt = new Date()
    await user.save()

    this.mailService.sendEmailFromTemplate({
      to: user.email,
      subject: 'Welcome to TextBee - Lets get started!',
      template: 'welcome-1',
      context: { name: user.name },
      from: 'vernu vernu@textbee.dev',
    })

    const payload = { email: user.email, sub: user._id }

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    }
  }

  async requestResetPassword({ email }: RequestResetPasswordInputDTO) {
    const user = await this.usersService.findOne({ email })
    if (!user) {
      return {
        message: 'If email is found you will receive a password reset email',
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000)

    const hashedOtp = await bcrypt.hash(otp, 10)
    const passwordReset = new this.passwordResetModel({
      user: user._id,
      otp: hashedOtp,
      expiresAt,
    })
    passwordReset.save()

    await this.mailService.sendEmailFromTemplate({
      to: user.email,
      subject: 'Password Reset',
      template: 'password-reset-request',
      context: { name: user.name, otp },
    })

    return { message: 'Password reset email sent' }
  }

  async resetPassword({ email, otp, newPassword }: ResetPasswordInputDTO) {
    const user = await this.usersService.findOne({ email })
    if (!user) {
      throw new HttpException({ error: 'User not found' }, HttpStatus.NOT_FOUND)
    }
    const passwordReset = await this.passwordResetModel.findOne(
      {
        user: user._id,
        expiresAt: { $gt: new Date() },
      },
      null,
      { sort: { createdAt: -1 } },
    )

    if (!passwordReset || !(await bcrypt.compare(otp, passwordReset.otp))) {
      throw new HttpException({ error: 'Invalid OTP' }, HttpStatus.BAD_REQUEST)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()

    this.mailService.sendEmailFromTemplate({
      to: user.email,
      subject: 'Password Reset',
      template: 'password-reset-success',
      context: { name: user.name },
    })

    return { message: 'Password reset successfully' }
  }

  async generateApiKey(currentUser: User) {
    const apiKey = uuidv4()
    const hashedApiKey = await bcrypt.hash(apiKey, 10)

    const newApiKey = new this.apiKeyModel({
      apiKey: apiKey.substr(0, 17) + '*'.repeat(18),
      hashedApiKey,
      user: currentUser._id,
    })

    await newApiKey.save()

    return { apiKey, message: 'Save this key, it wont be shown again ;)' }
  }

  async getUserApiKeys(currentUser: User) {
    return this.apiKeyModel.find({ user: currentUser._id })
  }

  async findApiKey(params) {
    return this.apiKeyModel.findOne(params)
  }

  async findApiKeyById(apiKeyId: string) {
    return this.apiKeyModel.findById(apiKeyId)
  }

  async deleteApiKey(apiKeyId: string) {
    const apiKey = await this.apiKeyModel.findOne({ _id: apiKeyId })
    if (!apiKey) {
      throw new HttpException(
        {
          error: 'Api key not found',
        },
        HttpStatus.NOT_FOUND,
      )
    }

    // await this.apiKeyModel.deleteOne({ _id: apiKeyId })
  }

  async trackAccessLog({ request }) {
    const { apiKey, user, method, url, ip, headers } = request
    const userAgent = headers['user-agent']

    if (request.apiKey) {
      this.apiKeyModel
        .findByIdAndUpdate(
          apiKey._id,
          { $inc: { usageCount: 1 }, lastUsedAt: new Date() },
          { new: true },
        )
        .exec()
        .catch((e) => {
          console.log('Failed to update api key usage count')
          console.log(e)
        })
    }

    this.accessLogModel
      .create({
        apiKey,
        user,
        method,
        url: url.split('?')[0],
        ip:
          request.headers['x-forwarded-for'] ||
          request.connection.remoteAddress ||
          ip,
        userAgent,
      })
      .catch((e) => {
        console.log('Failed to track access log')
        console.log(e)
      })
  }

  async validateEmail(email: string) {
    const re = /\S+@\S+\.\S+/
    if (!re.test(email)) {
      throw new HttpException(
        { error: 'Invalid email' },
        HttpStatus.BAD_REQUEST,
      )
    }
  }
  async validatePassword(password: string) {
    if (password.length < 6) {
      throw new HttpException(
        { error: 'Password must be at least 6 characters' },
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
