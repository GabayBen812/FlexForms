import apiClient from "@/api/apiClient";
import { FeatureFlag } from "@/types/feature-flags";
import { ApiQueryParams } from "@/types/ui/data-table-types";
import { MutationResponse } from "@/types/api/auth";
import { handleApiError } from "@/api/configs";

export async function fetchAllFeatureFlags(params: ApiQueryParams) {
  const res = await apiClient.get("/feature-flags", { params });
  return {
    data: res.data.data,
    totalCount: res.data.totalCount,
    totalPages: res.data.totalPages,
  };
}

export async function updateFeatureFlag(
  id: string,
  data: Partial<FeatureFlag>
): Promise<MutationResponse<FeatureFlag>> {
  try {
    const response = await apiClient.put<FeatureFlag>(`/feature-flags/${id}`, data);
    return { status: response.status, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
}

export async function deleteFeatureFlag(id: string) {
  const res = await apiClient.delete(`/feature-flags/${id}`);
  return res.data;
}

export async function createFeatureFlag(
  data: Pick<FeatureFlag, "key" | "name"> &
    Partial<Pick<FeatureFlag, "description" | "isEnabled" | "tags" | "metadata">>
): Promise<MutationResponse<FeatureFlag>> {
  try {
    const response = await apiClient.post<FeatureFlag>("/feature-flags", data);
    return { status: response.status, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
}