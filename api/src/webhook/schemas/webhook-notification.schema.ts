import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { WebhookSubscription } from './webhook-subscription.schema'
import { SMS } from '../../gateway/schemas/sms.schema'

export type WebhookNotificationDocument = WebhookNotification & Document

@Schema({ timestamps: true })
export class WebhookNotification {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: WebhookSubscription.name, required: true })
  webhookSubscription: WebhookSubscription

  @Prop({ type: String, required: true })
  event: string

  @Prop({ type: Object, required: true })
  payload: object

  @Prop({ type: Types.ObjectId, ref: SMS.name })
  sms: SMS

  @Prop({ type: Date })
  deliveredAt: Date

  @Prop({ type: Date })
  lastDeliveryAttemptAt: Date

  @Prop({ type: Date })
  nextDeliveryAttemptAt: Date

  @Prop({ type: Number, default: 0 })
  deliveryAttemptCount: number

  @Prop({ type: Date })
  deliveryAttemptAbortedAt: Date

  @Prop({ type: String })
  idempotencyKey?: string

  @Prop({ type: String, enum: ['retryable', 'non-retryable'] })
  errorType?: string

  @Prop({ type: Number })
  httpStatusCode?: number

  @Prop({ type: String, maxlength: 1000 })
  responseBody?: string

  @Prop({ type: String })
  deliveryUrl?: string
}

export const WebhookNotificationSchema =
  SchemaFactory.createForClass(WebhookNotification)
