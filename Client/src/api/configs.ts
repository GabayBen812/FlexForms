import { getSelectedOrganization } from "@/hooks/useOrganization";
import { MutationResponse } from "@/types/api/auth";
import { ApiQueryParams } from "@/types/ui/data-table-types";
import axios from "axios";

/**
 * Builds query parameters object from API params
 */
export const buildQueryParams = (
  params: ApiQueryParams
): Record<string, string> => {
  if (!params) return {};
  const organizationId = String(getSelectedOrganization());

  // Start with required parameters
  const queryParams: Record<string, string> = {
    organizationId,
    page: params?.page?.toString() || "",
    pageSize: params?.pageSize?.toString() || "",
  };

  // Add sorting parameters if provided
  if (params?.sortField) {
    queryParams.sortField = params.sortField;
    queryParams.sortDirection = params.sortDirection || "asc";
  }

  // Add search parameter if provided
  if (params?.search) {
    queryParams.search = params.search;
  }

  return queryParams;
};

/**
 * Handles API errors and formats them consistently
 */
export const handleApiError = (error: unknown): MutationResponse<never> => {
  console.error("Error fetching departments:", error);

  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status || 500,
      error: error.response?.data?.message || error.message || "Unknown error",
    };
  }

  return {
    status: 500,
    error: "Unknown error",
  };
};
