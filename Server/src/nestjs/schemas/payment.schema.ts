import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Form', required: true })
  formId!: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  service!: string;

  @Prop({ default: 'pending' })
  status!: 'paid' | 'failed' | 'pending';

  @Prop()
  lowProfileCode?: string;

  @Prop({ type: Object })
  cardDetails?: {
    cardOwnerName: string;
    cardOwnerEmail: string;
    last4Digits: string;
    expiryMonth: string;
    expiryYear: string;
    token: string;
  };
  @Prop({ type: Object })
  invoice?: {
    id: string;
    originalDocumentUrl: string;
};
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.set('collection', 'Payments');