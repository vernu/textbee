import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type ContactGroupMembershipDocument = ContactGroupMembership & Document

@Schema({ timestamps: true })
export class ContactGroupMembership {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Contact', required: true })
  contactId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'ContactSpreadsheet', required: true })
  groupId: Types.ObjectId

  @Prop({ type: Date, required: true, default: Date.now })
  addedAt: Date

  @Prop({ type: Boolean, default: false })
  wasNewContact: boolean
}

export const ContactGroupMembershipSchema = SchemaFactory.createForClass(ContactGroupMembership)

// Ensure unique membership per contact-group pair
ContactGroupMembershipSchema.index({ contactId: 1, groupId: 1 }, { unique: true })
// Index for efficient queries
ContactGroupMembershipSchema.index({ userId: 1, groupId: 1 })
ContactGroupMembershipSchema.index({ userId: 1, contactId: 1 })