import apiClient from "@/api/apiClient";
import { FeatureFlag } from "@/types/feature-flags";
import { ApiQueryParams } from '@/types/ui/data-table-types';

export async function fetchAllFeatureFlags(params: ApiQueryParams) {
  const res = await apiClient.get("/feature-flags", { params });
  return {
    data: res.data.data,
    totalCount: res.data.totalCount,
    totalPages: res.data.totalPages,
  };
}

export async function updateFeatureFlag(id: string, data: Partial<FeatureFlag>) {
  const res = await apiClient.put(`/feature-flags/${id}`, data);
  return res.data;
}

export async function deleteFeatureFlag(id: string) {
  const res = await apiClient.delete(`/feature-flags/${id}`);
  return res.data;
}