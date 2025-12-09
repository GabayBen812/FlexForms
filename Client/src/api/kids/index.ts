import apiClient from "@/api/apiClient";
import { Kid } from "@/types/kids/kid";

export const findKidByIdNumber = async (idNumber: string, organizationId: string) => {
  const response = await apiClient.get<{ status: number; data: Kid | null }>(
    "/kids/find-by-id-number",
    {
      params: { idNumber, organizationId },
    }
  );
  return response.data;
};

export const createKidPublic = async (kidData: Partial<Kid>) => {
  const response = await apiClient.post<Kid>("/kids/public", kidData);
  return response.data;
};

