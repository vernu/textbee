import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User, UserDocument } from './schemas/user.schema'
import { ConversationReadStatus, ConversationReadStatusDocument } from './schemas/conversation-read-status.schema'
import { ConversationMetadata, ConversationMetadataDocument } from './schemas/conversation-metadata.schema'
import { Model, Types } from 'mongoose'
import { Cron, CronExpression } from '@nestjs/schedule'
import { MailService } from '../mail/mail.service'
import { BillingService } from '../billing/billing.service'
import { Device, DeviceDocument } from '../gateway/schemas/device.schema'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ConversationReadStatus.name) private conversationReadStatusModel: Model<ConversationReadStatusDocument>,
    @InjectModel(ConversationMetadata.name) private conversationMetadataModel: Model<ConversationMetadataDocument>,
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
      // Get users who signed up between 3-4 days ago (not 1-2 days)
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

      const newUsers = await this.userModel.find({
        createdAt: {
          $gte: fourDaysAgo,
          $lt: threeDaysAgo,
        },
      })

      for (const user of newUsers) {
        try {
          // Check if user has any devices registered or has sent/received any SMS
          const devices = await this.deviceModel.find({ user: user._id })

          if (devices.length === 0 || devices.map(device=>device.sentSMSCount + device.receivedSMSCount).reduce((a,b)=>a+b,0) == 0) {
            // User hasn't registered any device, send email
            await this.mailService.sendEmailFromTemplate({
              to: user.email,
              subject:
                'Getting Started with textbee.dev - How Can We Help?',
              template: 'inactive-new-user',
              context: {
                name: user.name,
                registerDeviceUrl: `${process.env.FRONTEND_URL}/dashboard`,
              },
            })
            console.log(`Sent inactive new user email to ${user.email}`)
          }
          // Wait 200ms before processing the next user
          await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`Error processing email for user ${user.email}:`, error)
        }
      }
    } catch (error) {
      console.error('Error sending emails to inactive new users:', error)
    }
  }

  @Cron('0 13 * * *') // Every day at 1 PM
  async sendEmailToFreeUsers() {
    try {
      // Get users who signed up between 13-14 days ago
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      const thirteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)

      const usersToEmail = await this.userModel.find({
        createdAt: {
          $gte: fourteenDaysAgo,
          $lt: thirteenDaysAgo,
        },
      })

      for (const user of usersToEmail) {
        try {
          const subscription = await this.billingService.getActiveSubscription(
            user._id.toString(),
          )

          if (subscription?.plan?.name === 'free') {
            const devices = await this.deviceModel.find({ user: user._id })

            if (devices.length === 0 || devices.map(device=>device.sentSMSCount + device.receivedSMSCount).reduce((a,b)=>a+b,0) == 0) {
              // Only send this if they haven't set up any devices after 10-14 days
              await this.mailService.sendEmailFromTemplate({
                to: user.email,
                subject: `${user.name?.split(' ')[0]}, we'd love to help you get started with textbee.dev`,
                template: 'inactive-new-user-day-10',
                context: {
                  name: user.name,
                  registerDeviceUrl: `${process.env.FRONTEND_URL}/dashboard`,
                },
              })

              console.log(`Sent inactive new user email to ${user.email}`)
            } else {
              // Only send upgrade email to active users who have at least one device
              await this.mailService.sendEmailFromTemplate({
                to: user.email,
                subject: `${user.name?.split(' ')[0]}, unlock more capabilities with textbee.dev Pro`,
                template: 'upgrade-to-pro',
                context: {
                  name: user.name,
                  upgradeUrl: `${process.env.FRONTEND_URL}/checkout/pro`,
                  deviceCount: devices.length,
                },
              })
              console.log(`Sent upgrade to pro email to ${user.email}`)
            }
          }
          
          // Wait 200ms before processing the next user
          await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`Error processing email for user ${user.email}:`, error)
        }
      }
    } catch (error) {
      console.error('Error sending emails to free plan users:', error)
    }
  }

  async markConversationAsRead(
    userId: string,
    normalizedPhoneNumber: string,
    lastSeenAt: Date = new Date()
  ) {
    return await this.conversationReadStatusModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId), normalizedPhoneNumber },
      { lastSeenAt },
      { upsert: true, new: true }
    )
  }

  async getConversationReadStatuses(userId: string) {
    const statuses = await this.conversationReadStatusModel.find({
      user: new Types.ObjectId(userId)
    })

    const statusMap: Record<string, Date> = {}
    statuses.forEach(status => {
      statusMap[status.normalizedPhoneNumber] = status.lastSeenAt
    })

    return statusMap
  }

  async getConversationReadStatus(userId: string, normalizedPhoneNumber: string) {
    const status = await this.conversationReadStatusModel.findOne({
      user: new Types.ObjectId(userId),
      normalizedPhoneNumber
    })

    return status?.lastSeenAt || null
  }

  async getConversationMetadata(userId: string) {
    const metadata = await this.conversationMetadataModel.find({
      user: new Types.ObjectId(userId)
    })

    const metadataMap: Record<string, { isArchived: boolean; isBlocked: boolean; isStarred: boolean; archivedAt?: Date }> = {}
    metadata.forEach(meta => {
      metadataMap[meta.normalizedPhoneNumber] = {
        isArchived: meta.isArchived,
        isBlocked: meta.isBlocked,
        isStarred: meta.isStarred,
        archivedAt: meta.archivedAt
      }
    })

    return metadataMap
  }

  async archiveConversations(userId: string, phoneNumbers: string[]) {
    const operations = phoneNumbers.map(phoneNumber => ({
      updateOne: {
        filter: { user: new Types.ObjectId(userId), normalizedPhoneNumber: phoneNumber },
        update: {
          $set: {
            isArchived: true,
            archivedAt: new Date()
          }
        },
        upsert: true
      }
    }))

    await this.conversationMetadataModel.bulkWrite(operations)
    return { success: true, archivedCount: phoneNumbers.length }
  }

  async unarchiveConversations(userId: string, phoneNumbers: string[]) {
    const operations = phoneNumbers.map(phoneNumber => ({
      updateOne: {
        filter: { user: new Types.ObjectId(userId), normalizedPhoneNumber: phoneNumber },
        update: {
          $set: {
            isArchived: false,
            archivedAt: null
          }
        },
        upsert: true
      }
    }))

    await this.conversationMetadataModel.bulkWrite(operations)
    return { success: true, unarchivedCount: phoneNumbers.length }
  }

  async blockContacts(userId: string, phoneNumbers: string[]) {
    const operations = phoneNumbers.map(phoneNumber => ({
      updateOne: {
        filter: { user: new Types.ObjectId(userId), normalizedPhoneNumber: phoneNumber },
        update: {
          $set: {
            isBlocked: true,
            blockedAt: new Date(),
            // When blocking, remove from archived status - spam is separate from archived
            isArchived: false,
            archivedAt: null
          }
        },
        upsert: true
      }
    }))

    await this.conversationMetadataModel.bulkWrite(operations)
    return { success: true, blockedCount: phoneNumbers.length }
  }

  async unblockContacts(userId: string, phoneNumbers: string[]) {
    const operations = phoneNumbers.map(phoneNumber => ({
      updateOne: {
        filter: { user: new Types.ObjectId(userId), normalizedPhoneNumber: phoneNumber },
        update: {
          $set: {
            isBlocked: false,
            blockedAt: null
          }
        },
        upsert: true
      }
    }))

    await this.conversationMetadataModel.bulkWrite(operations)
    return { success: true, unblockedCount: phoneNumbers.length }
  }

  async toggleConversationStar(userId: string, phoneNumber: string, isStarred: boolean) {
    const result = await this.conversationMetadataModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId), normalizedPhoneNumber: phoneNumber },
      {
        $set: {
          isStarred,
          starredAt: isStarred ? new Date() : null
        }
      },
      { upsert: true, new: true }
    )

    return { success: true, isStarred: result.isStarred }
  }
}
