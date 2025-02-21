import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type PlanDocument = Plan & Document

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true, unique: true })
  name: string // free, pro, custom

  @Prop({ required: true })
  dailyLimit: number

  @Prop({ required: true })
  monthlyLimit: number

  @Prop({ required: true })
  bulkSendLimit: number

  @Prop({ required: true })
  monthlyPrice: number // in cents

  @Prop({})
  yearlyPrice: number // in cents

  @Prop({ type: String, unique: true })
  polarProductId?: string

  @Prop({ type: String, unique: true })
  polarMonthlyProductId?: string

  @Prop({ type: String, unique: true })
  polarYearlyProductId?: string

  @Prop({ type: Date })
  subscriptionStartDate?: Date

  @Prop({ type: Date })
  subscriptionEndDate?: Date

  @Prop({ type: Date })
  currentPeriodStart?: Date

  @Prop({ type: Date })
  currentPeriodEnd?: Date

  @Prop({ type: Boolean, default: true })
  isActive: boolean
}

export const PlanSchema = SchemaFactory.createForClass(Plan)
