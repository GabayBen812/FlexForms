import axios, { AxiosHeaders, type AxiosRequestHeaders } from 'axios';
import setCookie, { type Cookie } from 'set-cookie-parser';

import { clearAuthCookie, getAuthCookie, setAuthCookie } from '../utils/authCookie';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3101';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const cookie = await getAuthCookie();
  console.log('[API Client] Request to:', config.url, 'Auth:', cookie ? 'Present' : 'None');
  if (cookie) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    // For mobile apps, send JWT as Bearer token in Authorization header
    // Extract JWT value from cookie string (jwt=TOKEN)
    const jwtMatch = cookie.match(/jwt=([^;]+)/);
    if (jwtMatch && jwtMatch[1]) {
      headers.set('Authorization', `Bearer ${jwtMatch[1]}`);
      console.log('[API Client] Authorization header set with Bearer token');
    } else {
      // Fallback: send as cookie header
      headers.set('Cookie', cookie);
    }
    config.headers = headers as unknown as AxiosRequestHeaders;
  }
  return config;
});

api.interceptors.response.use(
  async (response) => {
    const cookieHeader = response.headers?.['set-cookie'];
    console.log('[API Client] Response from:', response.config.url, 'Set-Cookie:', cookieHeader ? 'Present' : 'None');

    if (cookieHeader) {
      const parsed = setCookie.parse(cookieHeader, { map: false }) as Cookie[];
      console.log('[API Client] Parsed cookies:', parsed);

      const authCookie = parsed.find((cookie) => cookie.httpOnly) ?? parsed[0];

      if (authCookie?.name && authCookie.value) {
        console.log('[API Client] Saving cookie:', authCookie.name);
        await setAuthCookie(`${authCookie.name}=${authCookie.value}`);
      }
    }

    return response;
  },
  async (error) => {
    console.log('[API Client] Error response:', error.response?.status, 'from:', error.config?.url);
    if (error.response?.status === 401) {
      console.log('[API Client] 401 - Clearing auth cookie');
      await clearAuthCookie();
    }
    return Promise.reject(error);
  }
);

export type ApiUserRole =
  | 'system_admin'
  | 'assistant_employee'
  | 'room_manager'
  | 'branch_manager'
  | 'district_manager'
  | 'finance_manager'
  | 'activity_manager'
  | 'shift_manager'
  | 'parent'
  | 'student';

export type ApiUser = {
  id: string;
  email: string;
  name?: string | null;
  role: ApiUserRole;
  organizationId?: string;
};


