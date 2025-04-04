import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from 'src/users/schemas/user.schema'

export type SupportMessageDocument = SupportMessage & Document

@Schema({ timestamps: true })
export class SupportMessage {
  @Prop({ type: Types.ObjectId, ref: User.name })
  user: User

  @Prop()
  name: string

  @Prop()
  email: string

  @Prop()
  phone: string

  @Prop()
  category: string

  @Prop()
  message: string

  @Prop()
  ip: string

  @Prop()
  userAgent: string

  @Prop({ default: 'RECEIVED' })
  type: string
}

export const SupportMessageSchema = SchemaFactory.createForClass(SupportMessage)
