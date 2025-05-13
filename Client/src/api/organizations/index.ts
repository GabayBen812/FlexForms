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
