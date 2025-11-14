import apiClient from '@/api/apiClient';
import { CreateInvoiceDto, InvoiceResponse } from '@/types/invoices/invoice';

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

export default {
  createInvoice,
};

