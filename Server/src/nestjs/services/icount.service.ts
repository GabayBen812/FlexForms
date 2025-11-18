import { Injectable, BadRequestException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { fetchDocumentFileName } from '../utils/document.utils';

// Enums for iCount API
export enum ICountDocumentType {
  INVOICE = 'invoice', // חשבונית
  RECEIPT = 'receipt', // קבלה
}

export enum ICountPaymentType {
  CASH = 'cash', // מזומן
  CHECK = 'check', // צק
  CREDIT_CARD = 'credit_card', // אשראי
  BANK_TRANSFER = 'bank_transfer', // העברה בנקאית
  BIT = 'bit', // ביט
}

export enum ICountCurrency {
  ILS = 'ILS',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

export enum ICountLanguage {
  HEBREW = 'he',
  ENGLISH = 'en',
}

export interface ICountCredentials {
  apiKey: string;
}

export interface ICountCustomer {
  name: string;
  personalId: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface ICountInvoiceItem {
  name: string;
  quantity: number;
  price: string | number;
  description?: string;
}

export interface ICountInvoice {
  subject?: string;
  description?: string;
  items: ICountInvoiceItem[];
}

export interface ICountPayment {
  date: Date;
  amount: string | number;
  type: ICountPaymentType | string;
  currency?: string;
}

export interface ICountDocumentRequest {
  type: string;
  customer: {
    name: string;
    id: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  payment: {
    date: string;
    amount: number;
    type: string;
    currency?: string;
  };
  description?: string;
  subject?: string;
}

interface ICountResponseData {
  id?: string;
  url?: string;
  error?: string;
  errorCode?: number;
  errorMessage?: string;
}

export interface ICountInvoiceResult {
  id: string;
  originalDocumentUrl: string;
  fileName?: string | null;
}

@Injectable()
export class ICountService {
  private readonly baseUrl = 'https://apiv3.icount.co.il';

  constructor() {}

  /**
   * Convert payment type string to ICountPaymentType enum value
   */
  private parsePaymentType(paymentType: ICountPaymentType | string): string {
    if (typeof paymentType === 'string' && Object.values(ICountPaymentType).includes(paymentType as ICountPaymentType)) {
      return paymentType;
    }

    // Support Hebrew strings for backward compatibility
    const paymentTypeMap: Record<string, ICountPaymentType> = {
      'מזומן': ICountPaymentType.CASH,
      'צק': ICountPaymentType.CHECK,
      'אשראי': ICountPaymentType.CREDIT_CARD,
      'העברה בנקאית': ICountPaymentType.BANK_TRANSFER,
      'ביט': ICountPaymentType.BIT,
    };

    return paymentTypeMap[paymentType] || ICountPaymentType.CREDIT_CARD;
  }

  /**
   * Create invoice document with support for multiple document types
   */
  createDocument(
    customer: ICountCustomer,
    invoice: ICountInvoice,
    payment: ICountPayment,
    documentType: ICountDocumentType,
    options?: {
      language?: ICountLanguage;
      currency?: ICountCurrency;
    },
  ): ICountDocumentRequest {
    const paymentType = this.parsePaymentType(payment.type);
    const language = options?.language || ICountLanguage.HEBREW;
    const currency = (options?.currency || payment.currency || ICountCurrency.ILS) as ICountCurrency;

    const customerData: ICountDocumentRequest['customer'] = {
      name: customer.name,
      id: customer.personalId,
      email: customer.email,
    };

    if (customer.phone) {
      customerData.phone = customer.phone;
    }

    if (customer.address) {
      customerData.address = customer.address;
    }

    const document: ICountDocumentRequest = {
      type: documentType,
      customer: customerData,
      items: invoice.items.map((item) => ({
        description: item.description || item.name,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
      })),
      payment: {
        date: `${payment.date.toISOString().split('T')[0]}`,
        amount: parseFloat(payment.amount.toString()),
        type: paymentType,
        currency: currency,
      },
    };

    // Add description if provided
    if (options?.language) {
      // iCount may use language in the request if needed
    }

    if (invoice.description || invoice.subject) {
      document.description = invoice.description || invoice.subject || '';
    }

    if (invoice.subject) {
      document.subject = invoice.subject;
    }

    return document;
  }

  /**
   * Parse response data and handle errors
   */
  private getResponseData(response: AxiosResponse): ICountResponseData {
    const data = response.data;

    if (data && (data.error || data.errorCode)) {
      const errorMessage = data.errorMessage || data.error || 'Unknown error from iCount API';
      throw new BadRequestException(`iCount API error: ${errorMessage} (Error Code: ${data.errorCode || 'N/A'})`);
    }

    if (!data || !data.id) {
      throw new BadRequestException('Invalid response from iCount API');
    }

    return data;
  }

  /**
   * Create invoice or receipt document
   */
  async createDocumentRequest(
    customer: ICountCustomer,
    invoice: ICountInvoice,
    payment: ICountPayment,
    documentType: ICountDocumentType,
    credentials: ICountCredentials,
    options?: {
      language?: ICountLanguage;
      currency?: ICountCurrency;
    },
  ): Promise<ICountInvoiceResult> {
    const doc = this.createDocument(customer, invoice, payment, documentType, options);

    const data = JSON.stringify(doc);

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${this.baseUrl}/api/doc_create`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credentials.apiKey}`,
      },
      data: data,
    };

    try {
      console.log('Creating document in iCount, URL:', config.url);
      console.log('Document data:', data);
      const response = await axios.request(config);
      console.log('iCount document creation response status:', response.status);
      console.log('iCount document creation response data:', response.data);

      const responseData = this.getResponseData(response);

      if (!responseData.id) {
        console.error('Invalid response from iCount:', responseData);
        throw new BadRequestException('Invalid response from iCount API: missing document ID');
      }

      // iCount may return URL in different formats, handle both
      const documentUrl = responseData.url || `${this.baseUrl}/doc/${responseData.id}`;
      const fileName = await fetchDocumentFileName(documentUrl).catch(() => null);

      return {
        id: responseData.id,
        originalDocumentUrl: documentUrl,
        fileName,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle axios errors
      if (error?.response) {
        console.error('iCount API error response:', error.response.status, error.response.data);
        const errorMessage =
          error.response.data?.errorMessage ||
          error.response.data?.error ||
          error.response.data?.message ||
          error.message;
        throw new BadRequestException(`iCount API error: ${errorMessage} (Status: ${error.response.status})`);
      }

      console.error('iCount document creation error:', error);
      throw new BadRequestException(
        `Failed to create document in iCount: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create invoice receipt (receipt type)
   */
  async createInvoiceReceipt(
    customer: ICountCustomer,
    invoice: ICountInvoice,
    payment: ICountPayment,
    credentials: ICountCredentials,
  ): Promise<ICountInvoiceResult> {
    return this.createDocumentRequest(
      customer,
      invoice,
      payment,
      ICountDocumentType.RECEIPT,
      credentials,
      {
        language: ICountLanguage.HEBREW,
        currency: ICountCurrency.ILS,
      },
    );
  }

  /**
   * Create invoice (invoice type)
   */
  async createInvoice(
    customer: ICountCustomer,
    invoice: ICountInvoice,
    payment: ICountPayment,
    credentials: ICountCredentials,
  ): Promise<ICountInvoiceResult> {
    return this.createDocumentRequest(
      customer,
      invoice,
      payment,
      ICountDocumentType.INVOICE,
      credentials,
      {
        language: ICountLanguage.HEBREW,
        currency: ICountCurrency.ILS,
      },
    );
  }
}

