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

export const updateOrganizationName = async (organizationId: string, name: string) => {
  return apiClient.put(`/organizations/${organizationId}`, { name });
};

export const fetchTableFieldDefinitions = async (organizationId: string): Promise<MutationResponse<Record<string, any>>> => {
  const res = await apiClient.get(`/organizations/${organizationId}/table-field-definitions`);
  return {
    status: res.status,
    data: res.data,
  };
};

export const updateTableFieldDefinitions = async (
  organizationId: string,
  tableFieldDefinitions: Record<string, any>
): Promise<MutationResponse<Organization>> => {
  const res = await apiClient.put(`/organizations/${organizationId}/table-field-definitions`, tableFieldDefinitions);
  return {
    status: res.status,
    data: res.data,
  };
};

export const updatePaymentSettings = async (
  organizationId: string,
  paymentSettings: {
    paymentProvider?: string;
    paymentProviderCredentials?: {
      terminalNumber?: string;
      username?: string;
      password?: string;
    };
    recurringChargeDay?: number;
    invoicingProvider?: string;
    invoicingProviderApiKey?: {
      apiKey: string;
      secret: string;
    };
    icountCredentials?: {
      apiKey: string;
    };
  }
): Promise<MutationResponse<Organization>> => {
  const res = await apiClient.put(`/organizations/${organizationId}`, paymentSettings);
  return {
    status: res.status,
    data: res.data,
  };
};