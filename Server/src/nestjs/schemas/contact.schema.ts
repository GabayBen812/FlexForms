import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContactDocument = Contact & Document;

export enum ContactType {
  PARENT = 'parent',
  KID = 'kid',
  CONTACT = 'contact',
  STAFF = 'staff',
}

export enum ContactStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true, versionKey: false })
export class Contact {
  @Prop({ required: true })
  firstname!: string;

  @Prop({ required: true })
  lastname!: string;

  @Prop({ type: String, enum: Object.values(ContactType), required: true })
  type!: ContactType;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop()
  idNumber?: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop({ type: String, enum: Object.values(ContactStatus), default: ContactStatus.ACTIVE })
  status!: ContactStatus;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: false })
  accountId?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  dynamicFields!: Record<string, any>;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
ContactSchema.set('collection', 'Contacts');
ContactSchema.index({ organizationId: 1, type: 1, lastname: 1, firstname: 1 });
ContactSchema.index({ organizationId: 1, status: 1 });
ContactSchema.index({ accountId: 1 });


