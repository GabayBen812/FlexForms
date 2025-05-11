import apiClient from "@/api/apiClient";
import { Organization } from "@/types/api/organization";
import { MutationResponse } from "@/types/api/auth";

export const fetchOrganization = async (): Promise<MutationResponse<Organization>> => {
  const res = await apiClient.get("/organizations/find");
  console.log("Response from fetchOrganization:", res);
  
  return {
    status: res.status,
    data: res.data,
  };
};

export const fetchAllOrganizations = async (): Promise<MutationResponse<Organization[]>> => {
  const res = await apiClient.get("/organizations");
  return {
    status: res.status,
    data: res.data,
  };
};
