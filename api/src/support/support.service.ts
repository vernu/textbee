import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { isValidObjectId, Model, Types } from 'mongoose'
import {
  SupportMessage,
  SupportMessageDocument,
} from './schemas/support-message.schema'
import { User, UserDocument } from '../users/schemas/user.schema'
import {
  CreateSupportMessageDto,
  SupportCategory,
} from './dto/create-support-message.dto'
import { MailService } from '../mail/mail.service'

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportMessage.name)
    private supportMessageModel: Model<SupportMessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  async createSupportMessage(
    createSupportMessageDto: CreateSupportMessageDto,
  ): Promise<{ message: string }> {
    try {
      // Create and save the support message
      const createdMessage = new this.supportMessageModel(
        createSupportMessageDto,
      )
      const savedMessage = await createdMessage.save()

      // Determine if the user is registered
      let user = null
      if (
        createSupportMessageDto.user &&
        isValidObjectId(createSupportMessageDto.user)
      ) {
        user = await this.userModel.findById(createSupportMessageDto.user)
      }

      // Send confirmation email to user
      await this.mailService.sendEmailFromTemplate({
        from: 'support@textbee.dev',
        to: createSupportMessageDto.email,
        cc: process.env.ADMIN_EMAIL,
        subject: `Support Request Submitted: ${createSupportMessageDto.category}-${savedMessage._id}`,
        template: 'customer-support-confirmation',
        context: {
          name: createSupportMessageDto.name,
          email: createSupportMessageDto.email,
          phone: createSupportMessageDto.phone || 'Not provided',
          category: createSupportMessageDto.category,
          message: createSupportMessageDto.message,
          appLogoUrl:
            process.env.APP_LOGO_URL || 'https://textbee.dev/logo.png',
          currentYear: new Date().getFullYear(),
        },
      })

      return { message: 'Support request submitted successfully' }
    } catch (error) {
      console.error('Error creating support message:', error)
      throw error
    }
  }

  // Method for account deletion requests
  async requestAccountDeletion(
    createSupportMessageDto: CreateSupportMessageDto,
  ): Promise<{ message: string }> {
    try {
      // Check if user exists
      if (
        !createSupportMessageDto.user ||
        !isValidObjectId(createSupportMessageDto.user)
      ) {
        throw new NotFoundException('User not found')
      }

      const userId = new Types.ObjectId(createSupportMessageDto.user.toString())
      const user = await this.userModel.findById(userId)

      if (!user) {
        throw new NotFoundException('User not found')
      }

      // Check if user has already requested deletion
      const existingRequest = await this.supportMessageModel.findOne({
        user: userId,
        category: SupportCategory.ACCOUNT_DELETION,
      })

      if (existingRequest) {
        throw new ConflictException(
          'Account deletion has already been requested',
        )
      }

      // Create and save the support message
      const createdMessage = new this.supportMessageModel(
        createSupportMessageDto,
      )
      const savedMessage = await createdMessage.save()

      // Update user's account deletion requested timestamp
      await this.userModel.updateOne(
        { _id: userId },
        {
          accountDeletionRequestedAt: new Date(),
          accountDeletionReason: createSupportMessageDto.message || null,
        },
      )

      // Send confirmation email
      await this.mailService.sendEmailFromTemplate({
        from: 'support@textbee.dev',
        to: user.email,
        cc: process.env.ADMIN_EMAIL,
        subject: `Account Deletion Request: ${savedMessage._id}`,
        template: 'account-deletion-request',
        context: {
          name: user.name,
          email: user.email,
          message: createSupportMessageDto.message || 'No reason provided',
          appLogoUrl:
            process.env.APP_LOGO_URL || 'https://textbee.dev/logo.png',
          currentYear: new Date().getFullYear(),
        },
      })

      return { message: 'Account deletion request submitted successfully' }
    } catch (error) {
      console.error('Error requesting account deletion:', error)
      throw error
    }
  }
}
