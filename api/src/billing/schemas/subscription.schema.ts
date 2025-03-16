import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'
import { Plan } from './plan.schema'

export enum SubscriptionStatus {
  Incomplete = 'incomplete',
  IncompleteExpired = 'incomplete_expired',
  Trialing = 'trialing',
  Active = 'active',
  PastDue = 'past_due',
  Canceled = 'canceled',
  Unpaid = 'unpaid',
}

export type SubscriptionDocument = Subscription & Document

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: User

  @Prop({ type: Types.ObjectId, ref: Plan.name, required: true })
  plan: Plan

  // @Prop()
  // polarSubscriptionId?: string

  @Prop({ type: String })
  recurringInterval?: string

  @Prop({ type: Date })
  subscriptionStartDate?: Date

  @Prop({ type: Number })
  amount?: number

  @Prop({ type: String })
  currency?: string

  @Prop({ type: Date })
  subscriptionEndDate?: Date

  @Prop({ type: Date })
  currentPeriodStart?: Date

  @Prop({ type: Date })
  currentPeriodEnd?: Date

  @Prop({ type: String })
  status: string

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
