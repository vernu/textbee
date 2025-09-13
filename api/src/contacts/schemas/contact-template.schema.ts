import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ContactTemplateDocument = ContactTemplate & Document

@Schema({ timestamps: true })
export class ContactTemplate {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ type: String, required: true })
  name: string

  @Prop({ type: Map, of: String, required: true })
  columnMapping: Map<string, string>

  @Prop({ type: Date, default: Date.now })
  createdAt: Date
}

export const ContactTemplateSchema = SchemaFactory.createForClass(ContactTemplate)