import apiClient from "@/api/apiClient";
import { Organization } from "@/types/api/organization";
import { MutationResponse } from "@/types/api/auth";

export const fetchOrganization = async (search?: string): Promise<MutationResponse<Organization>> => {
  const res = await apiClient.get("/organizations/find", { params: search ? { search } : {} });
  console.log("Response from fetchOrganization:", res);
  
  return {
    status: res.status,
    data: res.data,
  };
};

export const fetchAllOrganizations = async (params: Record<string, any> = {}): Promise<MutationResponse<Organization[]>> => {
  const res = await apiClient.get("/organizations", { params });
  return {
    status: res.status,
    data: res.data,
  };
};

export const assignFeatureFlagsToOrganization = async (orgId: string, featureFlagIds: string[]) => {
  return apiClient.put(`/organizations/${orgId}/feature-flags`, { featureFlagIds });
};

export const removeFeatureFlagFromOrganization = async (orgId: string, featureFlagId: string) => {
  return apiClient.put(`/organizations/${orgId}/feature-flags/remove`, { featureFlagId });
};
