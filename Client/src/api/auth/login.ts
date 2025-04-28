import apiClient from "@/api/apiClient";
import { LoginCredentials, MutationResponse } from "@/types/api/auth";
import { User } from "@/types/api/user";
import axios from "axios";

export const login = async (
  credentials: LoginCredentials
): Promise<MutationResponse<User>> => {
  try {
    const response = await apiClient.post<User>("/auth/login", credentials);
    return { status: response.status, data: response.data };
  } catch (error) {
    console.error("Error during login:", error);

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
