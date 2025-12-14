import { LoginCredentials, LoginResponse, MutationResponse } from "@/types/api/auth";
import apiClient from "./apiClient";

export interface MailCheck {
  email: string;
  status: string;
}

export async function login(credentials: LoginCredentials): Promise<MutationResponse<LoginResponse>> {
  try {
    const response = await apiClient.post<LoginResponse>("/auth/login", credentials);
    
    // Log response headers to check Set-Cookie
    console.log('🔍 Login response headers:', response.headers);
    console.log('🔍 Set-Cookie header:', response.headers['set-cookie']);
    console.log('🍪 Document.cookie after response:', document.cookie);
    
    return {
      status: response.status,
      data: response.data
    };
  } catch (error: any) {
    console.error('❌ Login error:', error);
    console.error('❌ Error response:', error.response);
    return {
      status: error.response?.status || 500,
      error: error.response?.data?.message || "An error occurred during login"
    };
  }
} 