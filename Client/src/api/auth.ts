import { LoginCredentials, LoginResponse, MutationResponse } from "@/types/api/auth";
import apiClient from "./apiClient";

export interface MailCheck {
  email: string;
  status: string;
}

export async function login(credentials: LoginCredentials): Promise<MutationResponse<LoginResponse>> {
  try {
    const response = await apiClient.post<LoginResponse>("/auth/login", credentials);
    return {
      status: response.status,
      data: response.data
    };
  } catch (error: any) {
    return {
      status: error.response?.status || 500,
      error: error.response?.data?.message || "An error occurred during login"
    };
  }
} 