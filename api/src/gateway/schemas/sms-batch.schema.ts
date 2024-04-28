import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { Device } from './device.schema'

export type SMSBatchDocument = SMSBatch & Document

@Schema({ timestamps: true })
export class SMSBatch {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: Device.name })
  device: Device

  @Prop({ type: String })
  message: string

  @Prop({ type: Boolean, default: false })
  encrypted: boolean

  @Prop({ type: String })
  encryptedMessage: string

  @Prop({ type: Number })
  recipientCount: number

  @Prop({ type: String })
  recipientPreview: string

  // misc metadata for debugging
  @Prop({ type: Object })
  metadata: Record<string, any>
}

export const SMSBatchSchema = SchemaFactory.createForClass(SMSBatch)
