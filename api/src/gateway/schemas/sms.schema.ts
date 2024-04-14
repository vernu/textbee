import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { Device } from './device.schema'
import { SMSType } from '../sms-type.enum'

export type SMSDocument = SMS & Document

@Schema({ timestamps: true })
export class SMS {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: Device.name, required: true })
  device: Device

  @Prop({ type: String, required: true })
  message: string

  @Prop({ type: String, required: true })
  type: string

  // fields for incoming messages
  @Prop({ type: String })
  sender: string

  @Prop({ type: Date, default: Date.now })
  receivedAt: Date

  // fields for outgoing messages
  @Prop({ type: String })
  recipient: string

  @Prop({ type: Date, default: Date.now })
  requestedAt: Date

  @Prop({ type: Date })
  sentAt: Date

  @Prop({ type: Date })
  deliveredAt: Date

  @Prop({ type: Date })
  failedAt: Date

  // @Prop({ type: String })
  // failureReason: string

  // @Prop({ type: String })
  // status: string

  // misc metadata for debugging
  @Prop({ type: Object })
  metadata: Record<string, any>
}

export const SMSSchema = SchemaFactory.createForClass(SMS)
