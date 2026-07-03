import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'

export type PasswordResetDocument = PasswordReset & Document

@Schema({ timestamps: true })
export class PasswordReset {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: User.name })
  user: User | Types.ObjectId

  @Prop({ type: String })
  otp: string

  @Prop({ type: Date })
  expiresAt: Date

  // Number of failed OTP verification attempts against this record.
  // Used to lock out brute-force attempts (see auth.service.resetPassword).
  @Prop({ type: Number, default: 0 })
  attempts: number
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset)
