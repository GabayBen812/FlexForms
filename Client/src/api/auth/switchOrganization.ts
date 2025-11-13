import apiClient from "@/api/apiClient";
import { MutationResponse } from "@/types/api/auth";

export const switchOrganization = async (organizationId: string): Promise<MutationResponse> => {
  const res = await apiClient.post(
    "/auth/switch-organization",
    { organizationId },
    {
      withCredentials: true,
    }
  );
  return {
    status: res.status,
    data: res.data,
  };
};

