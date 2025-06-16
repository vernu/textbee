import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { Device } from './device.schema'
import { SMSBatch } from './sms-batch.schema'

export type SMSDocument = SMS & Document

@Schema({ timestamps: true })
export class SMS {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: Device.name, required: true })
  device: Device

  @Prop({ type: Types.ObjectId, ref: SMSBatch.name })
  smsBatch: SMSBatch

  @Prop({ type: String })
  message: string

  @Prop({ type: Boolean, default: false })
  encrypted: boolean

  @Prop({ type: String })
  encryptedMessage: string

  @Prop({ type: String, required: true })
  type: string

  // fields for incoming messages
  @Prop({ type: String })
  sender: string

  @Prop({ type: Date })
  receivedAt: Date

  // fields for outgoing messages
  @Prop({ type: String })
  recipient: string

  @Prop({ type: Date })
  requestedAt: Date

  @Prop({ type: Date })
  sentAt: Date

  @Prop({ type: Date })
  deliveredAt: Date

  @Prop({ type: Date })
  failedAt: Date
  
  @Prop({ type: String, required: false })
  errorCode: string

  @Prop({ type: String, required: false })
  errorMessage: string

  // @Prop({ type: String })
  // failureReason: string

  @Prop({ type: String, default: 'pending' })
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'unknown' | 'received'

  // misc metadata for debugging
  @Prop({ type: Object })
  metadata: Record<string, any>
}

export const SMSSchema = SchemaFactory.createForClass(SMS)


SMSSchema.index({ device: 1, type: 1, receivedAt: -1 })
