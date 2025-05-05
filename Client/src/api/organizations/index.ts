import apiClient from "@/api/apiClient";
import { Organization } from "@/types/api/organization";
import { MutationResponse } from "@/types/api/auth";

export const fetchOrganization = async (): Promise<MutationResponse<Organization>> => {
  const res = await apiClient.get("/organizations/find");
  return {
    status: res.status,
    data: res.data,
  };
};
