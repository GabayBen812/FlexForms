import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RegistrationDocument = Registration & Document;

@Schema({ timestamps: true })
export class Registration {
  @Prop({ type: Types.ObjectId, ref: 'Form', required: true })
  formId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop()
  fullName!: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ type: Object })
  additionalData?: Record<string, any>;
}

export const RegistrationSchema = SchemaFactory.createForClass(Registration);
RegistrationSchema.set('collection', 'Registration');