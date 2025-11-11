import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContactRelationshipDocument = ContactRelationship & Document;

export enum ContactRelation {
  PARENT = 'parent',
  CHILD = 'child',
  GUARDIAN = 'guardian',
  EMERGENCY_CONTACT = 'emergency_contact',
  OTHER = 'other',
}

@Schema({ timestamps: true, versionKey: false })
export class ContactRelationship {
  @Prop({ type: Types.ObjectId, ref: 'Contact', required: true, index: true })
  sourceContactId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contact', required: true, index: true })
  targetContactId!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ContactRelation), required: true })
  relation!: ContactRelation;

  @Prop()
  note?: string;

  @Prop({ type: Number })
  priority?: number;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;
}

export const ContactRelationshipSchema = SchemaFactory.createForClass(ContactRelationship);
ContactRelationshipSchema.set('collection', 'ContactRelationships');
ContactRelationshipSchema.index({ sourceContactId: 1, targetContactId: 1, relation: 1 }, { unique: true });


