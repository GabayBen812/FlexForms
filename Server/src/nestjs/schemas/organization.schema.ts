import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
OrganizationSchema.set('collection', 'Organizations');