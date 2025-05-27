import { Injectable } from '@nestjs/common';

import axios, { AxiosResponse } from 'axios';


interface GreenInvoiceCredentials {
  apiKey: string;
  secret: string;
}

interface Customer {
  name: string;
  personalId: string;
  email: string;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: string | number;
}

interface Invoice {
  subject: string;
  items: InvoiceItem[];
}

interface Payment {
  date: Date;
  amount: string | number;
  type: string;
}

interface InvoiceDocument {
  lang: string;
  vatType: number;
  currency: string;
  type: number;
  client: {
    name: string;
    taxId: string;
    emails: string[];
  };
  description: string;
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

interface InvoiceResult {
  id: string;
  originalDocumentUrl: string;
}


@Injectable()
export class GreenInvoiceService {
  constructor() {}

  createInvoiceDocument = (customer: Customer, invoice: Invoice, payment: Payment): InvoiceDocument => {
    let paymentType = 3; // Default to credit card
    if (payment.type === 'צק') {
      paymentType = 2;
    }
    else if (payment.type === 'העברה בנקאית') {
      paymentType = 4;
    }
    else if (payment.type === 'מזומן') {
      paymentType = 1;
    }
    else if (payment.type === 'ביט') {
      paymentType = 10;
    }
  
    const baseFields = {
      lang: 'he',
      vatType: 0,
      currency: 'ILS',
      type: 320, 
    };
    
    return {
      ...baseFields,
      client: {
        name: customer.name,
        taxId: customer.personalId,
        emails: [customer.email]
      },
      description: invoice.subject,
      income: invoice.items.map(x => ({
        description: x.name,
        quantity: x.quantity,
        price: parseFloat(x.price.toString()),
        vatType: 1
      })),
      payment: [
        {
          date: `${payment.date.toISOString().split('T')[0]}`,
          price: parseFloat(payment.amount.toString()),
          type: paymentType,
          currency: 'ILS'
        }
      ],
    };
  }
  
  getResponseData = (response: AxiosResponse): ResponseData => {
    const data = response.data;
  
    if (data && data.errorCode) {
      console.log(data.errorMessage);
    }
  
    return data;
  }
  async getAuthToken(greenInvoiceCredentials: GreenInvoiceCredentials): Promise<string> {
    const data = JSON.stringify({
      "id": greenInvoiceCredentials.apiKey,
      "secret": greenInvoiceCredentials.secret
    });
    
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.greeninvoice.co.il/api/v1/account/token',
      headers: { 
        'Content-Type': 'application/json'
      },
      data: data
    };
    
    const response = await axios.request(config);
    return response.data.token;
  }
  
  async createInvoiceReceipt(customer: Customer, invoice: Invoice, payment: Payment, greenInvoiceCredentials: GreenInvoiceCredentials): Promise<InvoiceResult> {
    const doc = this.createInvoiceDocument(customer, invoice, payment);
    const token = await this.getAuthToken(greenInvoiceCredentials);
    
    const data = JSON.stringify(doc);
    
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.greeninvoice.co.il/api/v1/documents',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: data
    };
    
    const response = await axios.request(config);
    const responseData = this.getResponseData(response);
    
    return {
      id: responseData.id as string,
      originalDocumentUrl: responseData.url?.origin as string,
    };
  }
  

}

