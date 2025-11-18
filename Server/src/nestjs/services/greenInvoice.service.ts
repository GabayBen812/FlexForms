import { Injectable, BadRequestException } from '@nestjs/common';

import axios, { AxiosResponse } from 'axios';
import { fetchDocumentFileName } from '../utils/document.utils';

// Enums for GreenInvoice API
export enum DocumentType {
  INVOICE = 300, // חשבונית
  RECEIPT = 320, // קבלה
  INVOICE_RECEIPT = 330, // חשבונית מס/קבלה
  PROFORMA_INVOICE = 350, // חשבונית פרופורמה
  CREDIT_NOTE = 400, // זיכוי
}

export enum PaymentType {
  CASH = 1, // מזומן
  CHECK = 2, // צק
  CREDIT_CARD = 3, // אשראי
  BANK_TRANSFER = 4, // העברה בנקאית
  BIT = 10, // ביט
}

export enum VatType {
  NONE = 0,
  INCLUDED = 1,
  EXCLUDED = 2,
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

export interface GreenInvoiceCredentials {
  apiKey: string;
  secret: string;
}

export interface Customer {
  name: string;
  personalId: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: string | number;
  vatType?: number;
  description?: string;
}

export interface Invoice {
  subject?: string;
  description?: string;
  items: InvoiceItem[];
}

export interface Payment {
  date: Date;
  amount: string | number;
  type: PaymentType | string;
  currency?: string;
}

export interface CreateDocumentOptions {
  documentType: DocumentType;
  language?: Language;
  currency?: Currency;
  vatType?: VatType;
  subject?: string;
  description?: string;
}

export interface InvoiceDocument {
  lang: string;
  vatType: number;
  currency: string;
  type: number;
  client: {
    name: string;
    taxId: string;
    emails: string[];
    phone?: string;
    address?: string;
  };
  description?: string;
  income: Array<{
    description: string;
    quantity: number;
    price: number;
    vatType: number;
  }>;
  payment: Array<{
    date: string;
    price: number;
    type: number;
    currency: string;
  }>;
}

interface ResponseData {
  id?: string;
  url?: {
    origin: string;
  };
  errorCode?: number;
  errorMessage?: string;
  token?: string;
}

export interface InvoiceResult {
  id: string;
  originalDocumentUrl: string;
  fileName?: string | null;
}


@Injectable()
export class GreenInvoiceService {
  constructor() {}

  /**
   * Convert payment type string to PaymentType enum value
   */
  private parsePaymentType(paymentType: PaymentType | string): number {
    if (typeof paymentType === 'number') {
      return paymentType;
    }

    // Support Hebrew strings for backward compatibility
    const paymentTypeMap: Record<string, PaymentType> = {
      'מזומן': PaymentType.CASH,
      'צק': PaymentType.CHECK,
      'אשראי': PaymentType.CREDIT_CARD,
      'העברה בנקאית': PaymentType.BANK_TRANSFER,
      'ביט': PaymentType.BIT,
    };

    return paymentTypeMap[paymentType] || PaymentType.CREDIT_CARD;
  }

  /**
   * Create invoice document with support for multiple document types
   */
  createDocument(
    customer: Customer,
    invoice: Invoice,
    payment: Payment,
    options: CreateDocumentOptions,
  ): InvoiceDocument {
    const paymentType = this.parsePaymentType(payment.type);
    const language = options.language || Language.HEBREW;
    const currency = (options.currency || payment.currency || Currency.ILS) as Currency;
    const vatType = options.vatType ?? VatType.NONE;
    const documentType = options.documentType;

    const client: InvoiceDocument['client'] = {
      name: customer.name,
      taxId: customer.personalId,
      emails: [customer.email],
    };

    if (customer.phone) {
      client.phone = customer.phone;
    }

    if (customer.address) {
      client.address = customer.address;
    }

    const document: InvoiceDocument = {
      lang: language,
      vatType: vatType,
      currency: currency,
      type: documentType,
      client,
      income: invoice.items.map((item) => ({
        description: item.description || item.name,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        vatType: item.vatType ?? VatType.INCLUDED,
      })),
      payment: [
        {
          date: `${payment.date.toISOString().split('T')[0]}`,
          price: parseFloat(payment.amount.toString()),
          type: paymentType,
          currency: currency,
        },
      ],
    };

    // Add description if provided
    if (options.description || invoice.description || invoice.subject) {
      document.description = options.description || invoice.description || invoice.subject || '';
    }

    return document;
  }

  /**
   * Legacy method for backward compatibility - creates receipt (type 320)
   */
  createInvoiceDocument = (customer: Customer, invoice: Invoice, payment: Payment): InvoiceDocument => {
    return this.createDocument(customer, invoice, payment, {
      documentType: DocumentType.RECEIPT,
      language: Language.HEBREW,
      currency: Currency.ILS,
      vatType: VatType.NONE,
      description: invoice.subject,
    });
  };

  /**
   * Parse response data and handle errors
   */
  private getResponseData(response: AxiosResponse): ResponseData {
    const data = response.data;

    if (data && data.errorCode) {
      const errorMessage = data.errorMessage || 'Unknown error from GreenInvoice API';
      throw new BadRequestException(`GreenInvoice API error: ${errorMessage} (Error Code: ${data.errorCode})`);
    }

    if (!data || !data.id) {
      throw new BadRequestException('Invalid response from GreenInvoice API');
    }

    return data;
  }

  /**
   * Get authentication token from GreenInvoice API
   */
  async getAuthToken(greenInvoiceCredentials: GreenInvoiceCredentials): Promise<string> {
    try {
      const data = JSON.stringify({
        id: greenInvoiceCredentials.apiKey,
        secret: greenInvoiceCredentials.secret,
      });

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.greeninvoice.co.il/api/v1/account/token',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      };

      console.log('Requesting GreenInvoice token...');
      const response = await axios.request(config);
      console.log('GreenInvoice token response status:', response.status);
      console.log('GreenInvoice token response data:', response.data);

      if (!response.data || !response.data.token) {
        console.error('No token in response:', response.data);
        throw new BadRequestException('Failed to obtain authentication token from GreenInvoice');
      }

      return response.data.token;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle axios errors
      if (error?.response) {
        console.error('GreenInvoice API error response:', error.response.status, error.response.data);
        const errorMessage = error.response.data?.errorMessage || error.response.data?.message || error.message;
        throw new BadRequestException(
          `GreenInvoice API authentication failed: ${errorMessage} (Status: ${error.response.status})`,
        );
      }
      
      console.error('GreenInvoice authentication error:', error);
      throw new BadRequestException(
        `Failed to authenticate with GreenInvoice API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create any document type (invoice, receipt, credit note, etc.)
   */
  async createDocumentRequest(
    customer: Customer,
    invoice: Invoice,
    payment: Payment,
    options: CreateDocumentOptions,
    greenInvoiceCredentials: GreenInvoiceCredentials,
  ): Promise<InvoiceResult> {
    const doc = this.createDocument(customer, invoice, payment, options);
    const token = await this.getAuthToken(greenInvoiceCredentials);

    const data = JSON.stringify(doc);

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.greeninvoice.co.il/api/v1/documents',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      data: data,
    };

    try {
      console.log('Creating document in GreenInvoice, URL:', config.url);
      console.log('Document data:', data);
      const response = await axios.request(config);
      console.log('GreenInvoice document creation response status:', response.status);
      console.log('GreenInvoice document creation response data:', response.data);
      
      const responseData = this.getResponseData(response);

      if (!responseData.id || !responseData.url?.origin) {
        console.error('Invalid response from GreenInvoice:', responseData);
        throw new BadRequestException('Invalid response from GreenInvoice API: missing document ID or URL');
      }

      const fileName = await fetchDocumentFileName(responseData.url.origin).catch(() => null);

      return {
        id: responseData.id,
        originalDocumentUrl: responseData.url.origin,
        fileName,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle axios errors
      if (error?.response) {
        console.error('GreenInvoice API error response:', error.response.status, error.response.data);
        const errorMessage = error.response.data?.errorMessage || error.response.data?.message || error.message;
        throw new BadRequestException(
          `GreenInvoice API error: ${errorMessage} (Status: ${error.response.status})`,
        );
      }
      
      console.error('GreenInvoice document creation error:', error);
      throw new BadRequestException(
        `Failed to create document in GreenInvoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Legacy method for backward compatibility - creates invoice receipt
   */
  async createInvoiceReceipt(
    customer: Customer,
    invoice: Invoice,
    payment: Payment,
    greenInvoiceCredentials: GreenInvoiceCredentials,
  ): Promise<InvoiceResult> {
    return this.createDocumentRequest(
      customer,
      invoice,
      payment,
      {
        documentType: DocumentType.RECEIPT,
        language: Language.HEBREW,
        currency: Currency.ILS,
        vatType: VatType.NONE,
        description: invoice.subject,
      },
      greenInvoiceCredentials,
    );
  }
}

