import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ContactSpreadsheetDocument = ContactSpreadsheet & Document

@Schema({ timestamps: true })
export class ContactSpreadsheet {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ type: String, required: true })
  originalFileName: string

  @Prop({ type: Number, required: true })
  contactCount: number

  @Prop({ type: Date, required: true })
  uploadDate: Date

  @Prop({ type: String, required: true })
  fileContent: string

  @Prop({ type: Number, required: true })
  fileSize: number

  @Prop({ type: String, enum: ['pending', 'processed'], default: 'pending' })
  status: string

  @Prop({ type: Types.ObjectId, ref: 'ContactTemplate' })
  templateId?: Types.ObjectId

  @Prop({ type: Number, default: 0 })
  validContactsCount?: number

  @Prop({ type: Number, default: 0 })
  nonDncCount?: number

  @Prop({ type: Number, default: 0 })
  dncCount?: number

  @Prop({ type: Number })
  processedCount?: number

  @Prop({ type: Number })
  skippedCount?: number

  @Prop({ type: [String] })
  processingErrors?: string[]

  @Prop({
    type: [{
      phone: { type: String, required: true },
      firstName: { type: String },
      lastName: { type: String },
      reason: { type: String, required: true }
    }]
  })
  duplicateContacts?: Array<{
    phone: string
    firstName?: string
    lastName?: string
    reason: string
  }>
}

export const ContactSpreadsheetSchema = SchemaFactory.createForClass(ContactSpreadsheet)