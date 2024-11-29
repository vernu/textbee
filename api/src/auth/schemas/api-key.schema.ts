import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'

export type ApiKeyDocument = ApiKey & Document

@Schema({ timestamps: true })
export class ApiKey {
  _id?: Types.ObjectId

  @Prop({ type: String })
  apiKey: string // save first few chars only [ abc123****** ]

  @Prop({ type: String, default: 'API Key' })
  name: string
  
  @Prop({ type: String })
  hashedApiKey: string

  @Prop({ type: Types.ObjectId, ref: User.name })
  user: User

  @Prop({ type: Number, default: 0 })
  usageCount: number

  @Prop({ type: Date })
  lastUsedAt: Date

  @Prop({ type: Date })
  revokedAt?: Date
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey)
