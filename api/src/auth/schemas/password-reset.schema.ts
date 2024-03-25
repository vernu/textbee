import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'

export type PasswordResetDocument = PasswordReset & Document

@Schema({ timestamps: true })
export class PasswordReset {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: User.name })
  user: User

  @Prop({ type: String })
  otp: string

  @Prop({ type: Date })
  expiresAt: Date
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset)
