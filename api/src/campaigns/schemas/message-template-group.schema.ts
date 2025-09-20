import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type MessageTemplateGroupDocument = MessageTemplateGroup & Document

@Schema({ timestamps: true })
export class MessageTemplateGroup {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ type: String, required: true })
  name: string

  @Prop({ type: String })
  description?: string

  @Prop({ type: Number, default: 0 })
  order: number

  @Prop({ type: Date, default: Date.now })
  createdAt: Date

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date
}

export const MessageTemplateGroupSchema = SchemaFactory.createForClass(MessageTemplateGroup)

MessageTemplateGroupSchema.index({ userId: 1, name: 1 }, { unique: true })