import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'
import { ApiKey } from './api-key.schema'

export type AccessLogDocument = AccessLog & Document

@Schema({ timestamps: true })
export class AccessLog {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: ApiKey.name })
  apiKey: ApiKey

  @Prop({ type: Types.ObjectId, ref: User.name })
  user: User

  @Prop({ type: String })
  url: string

  @Prop({ type: String })
  method: string

  @Prop({ type: String })
  ip: string

  @Prop({ type: String })
  userAgent: string
}

export const AccessLogSchema = SchemaFactory.createForClass(AccessLog)
