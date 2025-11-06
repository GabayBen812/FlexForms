import { MutationResponse } from "@/types/api/auth";
import { ApiQueryParams } from "@/types/ui/data-table-types";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";

export const buildQueryParams = (
  params: ApiQueryParams,
  organizationId: string
): Record<string, string> => {
  if (!params || !organizationId) return {};

  const queryParams: Record<string, string> = {
    organizationId,
    page: params.page?.toString() || "",
    pageSize: params.pageSize?.toString() || "",
  };

  if (params.sortField) {
    queryParams.sortField = params.sortField;
    queryParams.sortDirection = params.sortDirection || "asc";
  }

  if (params.search) {
    queryParams.search = params.search;
  }

  // Include all other query parameters (advanced filters, etc.)
  Object.keys(params).forEach(key => {
    // Skip already processed fields
    if (key !== 'page' && key !== 'pageSize' && key !== 'sortField' && 
        key !== 'sortDirection' && key !== 'search' && key !== 'sortBy' && 
        key !== 'sortOrder') {
      const value = params[key as keyof ApiQueryParams];
      if (value !== undefined && value !== null && value !== '') {
        // Handle boolean values - convert to string 'true' or 'false'
        if (typeof value === 'boolean') {
          queryParams[key] = value ? 'true' : 'false';
        } else {
          queryParams[key] = String(value);
        }
      }
    }
  });

  return queryParams;
};

export const handleApiError = (error: unknown): MutationResponse<never> => {
  console.error("API Error:", error);

  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error
      || error.response?.data?.error?.message
      || (Array.isArray(error.response?.data?.message) ? error.response.data.message.join(", ") : null)
      || error.message 
      || "Unknown error";
    
    console.error("API Error Details:", {
      status,
      message: errorMessage,
      responseData: error.response?.data,
      fullError: error,
    });
    
    return {
      status,
      error: errorMessage,
    };
  }

  return {
    status: 500,
    error: "Unknown error",
  };
};
