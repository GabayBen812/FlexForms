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
  if (cookie) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    headers.set('Cookie', cookie);
    config.headers = headers as unknown as AxiosRequestHeaders;
  }
  return config;
});

api.interceptors.response.use(
  async (response) => {
    const cookieHeader = response.headers?.['set-cookie'];

    if (cookieHeader) {
      const parsed = setCookie.parse(cookieHeader, { map: false }) as Cookie[];

      const authCookie = parsed.find((cookie) => cookie.httpOnly) ?? parsed[0];

      if (authCookie?.name && authCookie.value) {
        await setAuthCookie(`${authCookie.name}=${authCookie.value}`);
      }
    }

    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
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
};


