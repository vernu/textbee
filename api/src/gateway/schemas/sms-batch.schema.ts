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

  // misc metadata for debugging
  @Prop({ type: Object })
  metadata: Record<string, any>
}

export const SMSBatchSchema = SchemaFactory.createForClass(SMSBatch)
