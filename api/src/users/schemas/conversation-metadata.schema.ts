import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ConversationMetadataDocument = ConversationMetadata & Document

@Schema({ timestamps: true })
export class ConversationMetadata {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId

  @Prop({ type: String, required: true })
  normalizedPhoneNumber: string

  @Prop({ type: Boolean, default: false })
  isArchived: boolean

  @Prop({ type: Boolean, default: false })
  isBlocked: boolean

  @Prop({ type: Boolean, default: false })
  isStarred: boolean

  @Prop({ type: Date })
  archivedAt?: Date

  @Prop({ type: Date })
  blockedAt?: Date

  @Prop({ type: Date })
  starredAt?: Date
}

export const ConversationMetadataSchema = SchemaFactory.createForClass(ConversationMetadata)

// Create compound index for efficient queries
ConversationMetadataSchema.index({ user: 1, normalizedPhoneNumber: 1 }, { unique: true })