import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Form', required: true })
  formId!: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  method!: string;

  @Prop({ default: 'pending' })
  status!: 'paid' | 'failed' | 'pending';

  @Prop()
  transactionId?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.set('collection', 'Payments');