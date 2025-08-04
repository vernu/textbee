import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'

export type CheckoutSessionDocument = CheckoutSession & Document

@Schema({ timestamps: true })
export class CheckoutSession {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: User

  @Prop({ type: String, required: true })
  checkoutSessionId: string

  @Prop({ type: String, required: true })
  checkoutUrl: string

  @Prop({ type: Date, required: true })
  expiresAt: Date

  @Prop({ type: Object, required: true, default: {} })
  payload: any
}

export const CheckoutSessionSchema = SchemaFactory.createForClass(CheckoutSession)
