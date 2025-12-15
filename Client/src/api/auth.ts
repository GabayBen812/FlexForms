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
    console.log('🔍 Login response headers (ALL):', JSON.stringify(response.headers, null, 2));
    console.log('🔍 Set-Cookie header:', response.headers['set-cookie']);
    console.log('🔍 Raw response:', response);
    console.log('🍪 Document.cookie after response:', document.cookie);
    
    // Try to get Set-Cookie from various possible locations
    if (response.headers) {
      const headerKeys = Object.keys(response.headers);
      console.log('🔍 Available header keys:', headerKeys);
      headerKeys.forEach(key => {
        if (key.toLowerCase().includes('cookie')) {
          console.log(`🔍 Found cookie-related header "${key}":`, response.headers[key]);
        }
      });
    }
    
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