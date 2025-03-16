import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User, UserDocument } from './schemas/user.schema'
import { Model } from 'mongoose'
import { Cron, CronExpression } from '@nestjs/schedule'
import { MailService } from '../mail/mail.service'
import { BillingService } from '../billing/billing.service'
import { Device, DeviceDocument } from '../gateway/schemas/device.schema'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    private mailService: MailService,
    private billingService: BillingService,
  ) {}

  async findOne(params) {
    return await this.userModel.findOne(params)
  }

  async findAll() {
    return await this.userModel.find()
  }

  async create({
    name,
    email,
    password,
    phone,
  }: {
    name: string
    email: string
    password?: string
    phone?: string
  }) {
    if (await this.findOne({ email })) {
      throw new HttpException(
        {
          error: 'user exists with the same email',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const newUser = new this.userModel({
      name,
      email,
      password,
      phone,
    })
    return await newUser.save()
  }

  async updateProfile(
    input: { name: string; phone: string },
    user: UserDocument,
  ) {
    const userToUpdate = await this.findOne({ _id: user._id })
    if (!userToUpdate) {
      throw new HttpException({ error: 'User not found' }, HttpStatus.NOT_FOUND)
    }

    if (input.name) {
      userToUpdate.name = input.name
    }
    if (input.phone) {
      userToUpdate.phone = input.phone
    }

    return await userToUpdate.save()
  }

  @Cron('0 12 * * *') // Every day at 12 PM
  async sendEmailToInactiveNewUsers() {
    try {
      // Get users who signed up between 24-48 hours ago (1-2 days ago)
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const newUsers = await this.userModel.find({
        createdAt: {
          $gte: twoDaysAgo,
          $lt: oneDayAgo,
        },
      })

      const emailPromises = newUsers.map(async (user) => {
        try {
          // Check if user has any devices registered
          const devices = await this.deviceModel.find({ user: user._id })

          if (devices.length === 0) {
            // User hasn't registered any device, send email
            await this.mailService.sendEmailFromTemplate({
              to: user.email,
              subject:
                'Get Started with textbee.dev - Register Your First Device',
              template: 'inactive-new-user',
              context: {
                name: user.name,
                registerDeviceUrl: `${process.env.FRONTEND_URL}/dashboard`,
              },
            })

            console.log(`Sent inactive new user email to ${user.email}`)
          }
        } catch (error) {
          console.error(`Error processing email for user ${user.email}:`, error)
        }
      })

      await Promise.allSettled(emailPromises)
    } catch (error) {
      console.error('Error sending emails to inactive new users:', error)
    }
  }

  @Cron('0 13 * * *') // Every day at 1 PM
  async sendEmailToFreeUsers() {
    try {
      // Get users who signed up between 3-4 days ago
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)

      const usersToEmail = await this.userModel.find({
        createdAt: {
          $gte: fourDaysAgo,
          $lt: threeDaysAgo,
        },
      })

      const emailPromises = usersToEmail.map(async (user) => {
        try {
          const subscription = await this.billingService.getActiveSubscription(
            user._id.toString(),
          )

          if (subscription?.plan?.name === 'free') {
            const devices = await this.deviceModel.find({ user: user._id })

            if (devices.length === 0) {
              await this.mailService.sendEmailFromTemplate({
                to: user.email,
                subject: `${user.name?.split(' ')[0]}, Your textbee.dev account is waiting for you!`,
                template: 'inactive-new-user-day-3',
                context: {
                  name: user.name,
                  registerDeviceUrl: `${process.env.FRONTEND_URL}/dashboard`,
                },
              })

              console.log(`Sent inactive new user email to ${user.email}`)
            } else {
              await this.mailService.sendEmailFromTemplate({
                to: user.email,
                subject: `${user.name?.split(' ')[0]}, Upgrade to Pro with a 30% Discount - textbee.dev`,
                template: 'upgrade-to-pro',
                context: {
                  name: user.name,
                  upgradeUrl: `${process.env.FRONTEND_URL}/checkout/pro`,
                },
              })
              console.log(`Sent upgrade to pro email to ${user.email}`)
            }
          }
        } catch (error) {
          console.error(`Error processing email for user ${user.email}:`, error)
        }
      })

      await Promise.allSettled(emailPromises)
    } catch (error) {
      console.error('Error sending emails to free plan users:', error)
    }
  }
}
