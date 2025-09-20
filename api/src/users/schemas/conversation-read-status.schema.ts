import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ConversationReadStatusDocument = ConversationReadStatus & Document

@Schema({ timestamps: true })
export class ConversationReadStatus {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId

  @Prop({ type: String, required: true })
  normalizedPhoneNumber: string

  @Prop({ type: Date, required: true })
  lastSeenAt: Date
}

export const ConversationReadStatusSchema = SchemaFactory.createForClass(ConversationReadStatus)

// Create compound index for efficient queries
ConversationReadStatusSchema.index({ user: 1, normalizedPhoneNumber: 1 }, { unique: true })