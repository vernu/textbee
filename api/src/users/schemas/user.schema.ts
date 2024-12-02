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

  @Prop({ type: String, unique: true })
  googleId?: string

  @Prop({ type: String })
  avatar?: string

  @Prop({ type: String, trim: true })
  phone?: string

  @Prop({ type: String })
  password: string

  @Prop({ type: String, default: UserRole.REGULAR })
  role: string

  @Prop({ type: Date })
  lastLoginAt: Date
}

export const UserSchema = SchemaFactory.createForClass(User)
