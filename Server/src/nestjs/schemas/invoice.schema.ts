import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Form' })
  formId?: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  invoiceNumber!: string;

  @Prop({ required: true, type: Date, default: Date.now })
  invoiceDate!: Date;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ 
    required: true, 
    enum: Object.values(InvoiceStatus), 
    default: InvoiceStatus.DRAFT 
  })
  status!: InvoiceStatus;

  // Client/Parent information
  @Prop({ type: Object, required: true })
  client!: {
    name: string;
    personalId: string;
    email: string;
    phone?: string;
    address?: string;
  };

  // Line items
  @Prop({ type: Array, required: true })
  items!: Array<{
    name: string;
    quantity: number;
    price: number;
    vatType?: number;
    description?: string;
  }>;

  // Financial totals
  @Prop({ required: true, type: Number, default: 0 })
  subtotal!: number;

  @Prop({ type: Number, default: 0 })
  tax!: number;

  @Prop({ required: true, type: Number, default: 0 })
  total!: number;

  @Prop({ type: Number, default: 0 })
  paidAmount!: number;

  @Prop({ type: Number, default: 0 })
  remainingAmount!: number;

  @Prop()
  externalInvoiceNumber?: string;

  // GreenInvoice integration
  @Prop({ type: Object })
  greenInvoice?: {
    id: string;
    originalDocumentUrl: string;
    documentType?: number;
  };

  // iCount integration
  @Prop({ type: Object })
  icount?: {
    id: string;
    originalDocumentUrl: string;
    documentType?: string;
  };

  // Metadata
  @Prop()
  subject?: string;

  @Prop()
  description?: string;

  @Prop({ enum: ['he', 'en'], default: 'he' })
  language?: string;

  @Prop({ enum: ['ILS', 'USD', 'EUR', 'GBP'], default: 'ILS' })
  currency?: string;

  @Prop({ type: Number })
  vatType?: number;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.set('collection', 'Invoices');

// Indexes for common queries
InvoiceSchema.index({ organizationId: 1, invoiceDate: -1 });
InvoiceSchema.index({ organizationId: 1, status: 1 });
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ formId: 1 });

