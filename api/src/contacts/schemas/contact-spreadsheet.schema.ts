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
}

export const ContactSpreadsheetSchema = SchemaFactory.createForClass(ContactSpreadsheet)