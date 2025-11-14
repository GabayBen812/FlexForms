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
    documentUrl: string;
  };
}

