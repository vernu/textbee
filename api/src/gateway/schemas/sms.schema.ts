import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { Device } from './device.schema'

export type SMSDocument = SMS & Document

@Schema({ timestamps: true })
export class SMS {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: Device.name })
  device: Device

  @Prop({ type: String, required: true })
  message: string

  @Prop({ type: String, required: true })
  to: string
}

export const SMSSchema = SchemaFactory.createForClass(SMS)
