import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop()
  supplierId?: string;

  @Prop({ type: [String], required: true })
  category!: string[];

  @Prop({ 
    required: true,
    enum: ['Cash', 'Credit Card', 'Bank Transfer', 'Check']
  })
  paymentMethod!: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Check';

  @Prop()
  invoicePicture?: string;

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
ExpenseSchema.set('collection', 'Expenses');

