import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FormDocument = Form & Document;

@Schema({ timestamps: true })
export class Form {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop()
  paymentSum?: number;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Season' })
  seasonId?: Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  fields!: Record<string, any>[];

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  createdAt!: Date;

  @Prop()
  code!: number;

  @Prop()
  maxRegistrators?: number;

  @Prop()
  registrationDeadline?: string;

  @Prop()
  backgroundColor?: string;
}

export const FormSchema = SchemaFactory.createForClass(Form);
FormSchema.set('collection', 'Forms');