import { api } from './client';

export type Payment = {
  id?: string;
  _id?: string;
  amount: number;
  service: string;
  status: string;
  lowProfileCode?: string;
  cardDetails?: {
    cardOwnerName: string;
    cardOwnerEmail: string;
    last4Digits: string;
    expiryMonth: string;
    expiryYear: string;
    token: string;
  };
  invoiceId?: string;
  paymentDate: string;
  paymentMethod?: 'credit_card' | 'check' | 'bank_transfer' | 'cash';
  payerContactId?: string;
  payerAccountId?: string;
  notes?: string;
  metadata?: Record<string, any>;
  formId: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchPayments(organizationId?: string): Promise<Payment[]> {
  const params = organizationId ? { organizationId } : {};
  const response = await api.get<Payment[]>('/payments', { params });
  // Sort by paymentDate or createdAt (newest first)
  const payments = response.data || [];
  return payments.sort((a, b) => {
    const dateA = new Date(a.paymentDate || a.createdAt || '').getTime();
    const dateB = new Date(b.paymentDate || b.createdAt || '').getTime();
    return dateB - dateA;
  });
}

