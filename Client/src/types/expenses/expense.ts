export interface Expense {
  _id?: string;
  id?: string;
  date: string | Date;
  amount: number;
  supplierId?: string;
  category: string[];
  paymentMethod: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Check';
  invoicePicture?: string;
  notes?: string;
  organizationId: string;
  dynamicFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

