import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'
import { Plan } from './plan.schema'

export type SubscriptionDocument = Subscription & Document

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: User

  @Prop({ type: Types.ObjectId, ref: Plan.name, required: true })
  plan: Plan

  // @Prop()
  // polarSubscriptionId?: string

  @Prop({ type: Date })
  startDate: Date

  @Prop({ type: Date })
  endDate: Date

  @Prop({ type: Boolean, default: true })
  isActive: boolean

  // Custom limits for custom plans
  @Prop({ type: Number })
  customDailyLimit?: number

  @Prop({ type: Number })
  customMonthlyLimit?: number

  @Prop({ type: Number })
  customBulkSendLimit?: number
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription)

// a user can only have one active subscription at a time
SubscriptionSchema.index({ user: 1, isActive: 1 }, { unique: true })
