import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'
import { WebhookEvent } from '../webhook-event.enum'

export type WebhookSubscriptionDocument = WebhookSubscription & Document

@Schema({ timestamps: true })
export class WebhookSubscription {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: User

  @Prop({ type: Boolean, default: true })
  isActive: boolean

  @Prop({ type: [String], default: [WebhookEvent.MESSAGE_RECEIVED] })
  events: string[]

  @Prop({ type: String, required: true })
  deliveryUrl: string

  @Prop({ type: String, required: true })
  signingSecret: string

  @Prop({ type: Number, default: 0 })
  successfulDeliveryCount: number

  @Prop({ type: Number, default: 0 })
  deliveryFailureCount: number
  @Prop({ type: Number, default: 0 })
  deliveryAttemptCount: number

  @Prop({ type: Date })
  lastDeliveryAttemptAt: Date

  @Prop({ type: Date })
  lastDeliverySuccessAt: Date

  @Prop({ type: Date })
  lastDeliveryFailureAt: Date
}

export const WebhookSubscriptionSchema =
  SchemaFactory.createForClass(WebhookSubscription)

WebhookSubscriptionSchema.index({ user: 1, events: 1 }, { unique: true })
