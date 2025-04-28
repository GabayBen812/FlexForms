import apiClient from "@/api/apiClient";
import { MailCheck, MutationResponse } from "@/types/api/auth";
import axios from "axios";
export const checkEmail = async (
  email: string
): Promise<MutationResponse<MailCheck[]>> => {
  try {
    const response = await apiClient.post<MailCheck[]>("/auth/check-email", {
      email,
    });
    return { status: response.status, data: response.data };
  } catch (error: unknown) {
    console.error("Error checking email hotels:", error);

    if (axios.isAxiosError(error)) {
      return {
        status: error.response?.status || 500,
        error:
          error.response?.data?.message || error.message || "Unknown error",
      };
    }

    return {
      status: 500,
      error: "An unexpected error occurred",
    };
  }
};
