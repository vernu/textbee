import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ContactDocument = Contact & Document

@Schema({ timestamps: true })
export class Contact {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'ContactSpreadsheet' })
  spreadsheetId?: Types.ObjectId

  @Prop({ type: String })
  firstName?: string

  @Prop({ type: String })
  lastName?: string

  @Prop({ type: String, required: true })
  phone: string

  @Prop({ type: String })
  email?: string

  @Prop({ type: String })
  propertyAddress?: string

  @Prop({ type: String })
  propertyCity?: string

  @Prop({ type: String })
  propertyState?: string

  @Prop({ type: String })
  propertyZip?: string

  @Prop({ type: String })
  parcelCounty?: string

  @Prop({ type: String })
  parcelState?: string

  @Prop({ type: Number })
  parcelAcres?: number

  @Prop({ type: String })
  apn?: string

  @Prop({ type: String })
  mailingAddress?: string

  @Prop({ type: String })
  mailingCity?: string

  @Prop({ type: String })
  mailingState?: string

  @Prop({ type: String })
  mailingZip?: string
}

export const ContactSchema = SchemaFactory.createForClass(Contact)

ContactSchema.index({ userId: 1, phone: 1 }, { unique: true })