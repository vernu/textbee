import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type MessageTemplateDocument = MessageTemplate & Document

@Schema({ timestamps: true })
export class MessageTemplate {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'MessageTemplateGroup', required: true })
  groupId: Types.ObjectId

  @Prop({ type: String, required: true })
  name: string

  @Prop({ type: String, required: true })
  content: string

  @Prop({ type: Date, default: Date.now })
  createdAt: Date

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date
}

export const MessageTemplateSchema = SchemaFactory.createForClass(MessageTemplate)

MessageTemplateSchema.index({ userId: 1, groupId: 1 })
MessageTemplateSchema.index({ groupId: 1, name: 1 }, { unique: true })