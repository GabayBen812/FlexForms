import type { AxiosError } from 'axios';

import { api, type ApiUser } from './client';
import { clearAuthCookie } from '../utils/authCookie';

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthErrorResponse = {
  message?: string;
};

export async function login(payload: LoginPayload): Promise<void> {
  await api.post('/auth/login', payload);
}

export async function fetchCurrentUser(): Promise<ApiUser> {
  const response = await api.get<ApiUser>('/auth/user');
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    await clearAuthCookie();
  }
}

export function extractErrorMessage(error: unknown): string {
  if (!error) {
    return 'אירעה שגיאה לא ידועה';
  }

  const axiosError = error as AxiosError<AuthErrorResponse>;
  const responseMessage = axiosError.response?.data?.message;
  if (typeof responseMessage === 'string') {
    return responseMessage;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return 'אירעה שגיאה לא ידועה';
}


