import { api } from './client';

export type Expense = {
  _id: string;
  date: string;
  amount: number;
  supplierId?: string;
  category: string[];
  paymentMethod: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Check';
  invoicePicture?: string;
  notes?: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchExpenses(): Promise<Expense[]> {
  const response = await api.get<Expense[]>('/expenses');
  // Sort by date (newest first)
  const expenses = response.data || [];
  return expenses.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
}

