import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'

export type CheckoutSessionDocument = CheckoutSession & Document

export interface AbandonedEmailRecord {
  emailType: 'first_reminder' | 'second_reminder' | 'third_reminder' | 'final_reminder' | 'last_chance'
  sentAt: Date
  emailSubject: string
}

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

  // Abandoned checkout email tracking
  @Prop({ 
    type: [{ 
      emailType: { type: String, enum: ['first_reminder', 'second_reminder', 'third_reminder', 'final_reminder', 'last_chance'] },
      sentAt: { type: Date },
      emailSubject: { type: String }
    }], 
    default: [] 
  })
  abandonedEmails: AbandonedEmailRecord[]

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean

  @Prop({ type: Boolean, default: false })
  isAbandoned: boolean

  @Prop({ type: Date })
  completedAt?: Date
}

export const CheckoutSessionSchema = SchemaFactory.createForClass(CheckoutSession)
