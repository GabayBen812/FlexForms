import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  CHECK = 'check',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

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

  @Prop({ type: Types.ObjectId, ref: 'Invoice' })
  invoiceId?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  paymentDate!: Date;

  @Prop({ 
    type: String, 
    enum: Object.values(PaymentMethod),
    required: false 
  })
  paymentMethod?: PaymentMethod;

  @Prop({ type: Types.ObjectId, ref: 'Contact' })
  payerContactId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account' })
  payerAccountId?: Types.ObjectId;

  @Prop()
  notes?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.set('collection', 'Payments');