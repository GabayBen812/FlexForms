export enum InvoiceDocumentType {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  INVOICE_RECEIPT = 'invoiceReceipt',
  CREDIT_NOTE = 'creditNote',
  PROFORMA = 'proforma',
}

export enum InvoicePaymentType {
  CASH = 'cash',
  CHECK = 'check',
  CREDIT_CARD = 'creditCard',
  BANK_TRANSFER = 'bankTransfer',
  BIT = 'bit',
}

export enum Currency {
  ILS = 'ILS',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

export enum Language {
  HEBREW = 'he',
  ENGLISH = 'en',
}

export enum VatType {
  NONE = 0,
  INCLUDED = 1,
  EXCLUDED = 2,
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface InvoiceClient {
  name: string;
  personalId: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  vatType?: number;
  description?: string;
}

export interface InvoicePayment {
  type: InvoicePaymentType;
  date: string;
  amount: number;
  currency?: Currency;
}

export interface CreateInvoiceDto {
  organizationId: string;
  documentType: InvoiceDocumentType;
  client: InvoiceClient;
  items: InvoiceItem[];
  payment: InvoicePayment;
  subject?: string;
  description?: string;
  language?: Language;
  currency?: Currency;
  vatType?: VatType;
}

export interface InvoiceResponse {
  success: boolean;
  data: {
    id: string;
    invoiceNumber?: string;
    greenInvoiceId?: string;
    documentUrl: string;
  };
}

export interface Invoice {
  _id?: string;
  id?: string;
  organizationId: string;
  formId?: string;
  invoiceNumber: string;
  invoiceDate: string | Date;
  dueDate?: string | Date;
  status: InvoiceStatus;
  client: InvoiceClient;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  externalInvoiceNumber?: string;
  greenInvoice?: {
    id: string;
    originalDocumentUrl: string;
    documentType?: number;
  };
  icount?: {
    id: string;
    originalDocumentUrl: string;
    documentType?: string;
  };
  subject?: string;
  description?: string;
  language?: Language;
  currency?: Currency;
  vatType?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

