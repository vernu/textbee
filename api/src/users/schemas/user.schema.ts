import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { UserRole } from '../user-roles.enum'

export type UserDocument = User & Document

@Schema({ timestamps: true })
export class User {
  _id?: Types.ObjectId

  @Prop({ type: String })
  name: string

  @Prop({ type: String, required: true, unique: true, lowercase: true })
  email: string

  @Prop({ type: String, unique: true, sparse: true })
  googleId?: string

  @Prop({ type: String })
  avatar?: string

  @Prop({ type: String, trim: true })
  phone?: string

  // Never loaded unless a caller asks with .select('+password').
  @Prop({ type: String, select: false })
  password: string

  @Prop({ type: String, default: UserRole.REGULAR })
  role: string

  @Prop({ type: Date })
  lastLoginAt: Date

  @Prop({ type: Date })
  emailVerifiedAt: Date

  @Prop({ type: Boolean, default: false })
  isBanned: boolean

  @Prop({ type: Date })
  accountDeletionRequestedAt: Date

  @Prop({ type: String })
  accountDeletionReason: string

  @Prop({ type: Object })
  meta: Object

  @Prop({
    type: {
      completedAt: { type: Date },
      currentStepId: { type: String, default: 'verify_email' },
      skippedStepIds: { type: [String], default: [] },
    },
    default: () => ({ currentStepId: 'verify_email', skippedStepIds: [] }),
  })
  onboarding?: {
    completedAt?: Date
    currentStepId?: string
    skippedStepIds?: string[]
  }
}

export const UserSchema = SchemaFactory.createForClass(User)
