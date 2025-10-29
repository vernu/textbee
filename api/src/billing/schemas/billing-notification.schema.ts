import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'

export type BillingNotificationDocument = BillingNotification & Document

export enum BillingNotificationType {
  EMAIL_VERIFICATION_REQUIRED = 'email_verification_required',
  DAILY_LIMIT_REACHED = 'daily_limit_reached',
  MONTHLY_LIMIT_REACHED = 'monthly_limit_reached',
  BULK_SMS_LIMIT_REACHED = 'bulk_sms_limit_reached',
  DAILY_LIMIT_APPROACHING = 'daily_limit_approaching',
  MONTHLY_LIMIT_APPROACHING = 'monthly_limit_approaching',
}

@Schema({ timestamps: true })
export class BillingNotification {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  user: User

  @Prop({ type: String, enum: Object.values(BillingNotificationType), required: true, index: true })
  type: BillingNotificationType

  @Prop({ type: String, required: true })
  title: string

  @Prop({ type: String, required: true })
  message: string

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>

  @Prop({ type: Date })
  readAt?: Date

  @Prop({ type: Boolean, default: false })
  isDismissed: boolean

  @Prop({ type: Number, default: 0 })
  sentEmailCount: number

  @Prop({ type: Date })
  lastEmailSentAt?: Date

  // present because of timestamps: true
  @Prop({ type: Date })
  createdAt?: Date

  @Prop({ type: Date })
  updatedAt?: Date
}

export const BillingNotificationSchema =
  SchemaFactory.createForClass(BillingNotification)


