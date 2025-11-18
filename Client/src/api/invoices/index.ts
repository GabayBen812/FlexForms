import apiClient from '@/api/apiClient';
import { CreateInvoiceDto, InvoiceResponse, Invoice, InvoiceStatus } from '@/types/invoices/invoice';

export const createInvoice = async (data: CreateInvoiceDto): Promise<InvoiceResponse> => {
  try {
    const response = await apiClient.post<InvoiceResponse>('/invoices', data);
    
    if (!response.data) {
      throw new Error('Invalid response from invoice service');
    }

    return response.data;
  } catch (error: any) {
    // Extract detailed error message from axios error response
    if (error?.response?.data) {
      const errorData = error.response.data;
      // Handle validation errors
      if (errorData.message) {
        if (Array.isArray(errorData.message)) {
          throw new Error(`Validation error: ${errorData.message.join(', ')}`);
        }
        throw new Error(errorData.message);
      }
      // Handle other error formats
      if (errorData.error) {
        throw new Error(errorData.error);
      }
    }
    // Fallback to standard error message
    if (error?.message) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
    throw new Error('Failed to create invoice: Unknown error');
  }
};

export const getInvoices = async (params?: {
  organizationId?: string;
  status?: InvoiceStatus;
  fromDate?: string;
  toDate?: string;
}): Promise<Invoice[]> => {
  try {
    const response = await apiClient.get<Invoice[]>('/invoices', { params });
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to fetch invoices');
  }
};

export const getInvoice = async (id: string): Promise<Invoice> => {
  try {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to fetch invoice');
  }
};

export const updateInvoice = async (
  id: string,
  data: Partial<CreateInvoiceDto>
): Promise<Invoice> => {
  try {
    const response = await apiClient.put<Invoice>(`/invoices/${id}`, data);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to update invoice');
  }
};

export const updateInvoiceStatus = async (
  id: string,
  status: InvoiceStatus
): Promise<Invoice> => {
  try {
    const response = await apiClient.patch<Invoice>(`/invoices/${id}/status`, { status });
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to update invoice status');
  }
};

export const getInvoicePayments = async (id: string): Promise<any[]> => {
  try {
    const response = await apiClient.get<any[]>(`/invoices/${id}/payments`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to fetch invoice payments');
  }
};

export default {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  updateInvoiceStatus,
  getInvoicePayments,
};

