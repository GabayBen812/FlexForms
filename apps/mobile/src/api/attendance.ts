import type { AxiosError } from 'axios';

import { api, type ApiUser, type ApiUserRole } from './client';

export type ShiftAction = 'start' | 'pause' | 'resume' | 'stop';

export type ShiftActionPayload = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: ApiUserRole;
  };
  action: ShiftAction;
  timestamp: string; // ISO 8601 format
};

export type ShiftActionResponse = {
  success?: boolean;
  message?: string;
};

export type AttendanceErrorResponse = {
  message?: string;
};

export type AttendanceRecord = {
  _id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: ApiUserRole;
  };
  organizationId: string;
  action: ShiftAction;
  timestamp: string; // ISO 8601 format
};

export type AttendanceShift = {
  _id?: string;
  employeeName: string;
  reportedDate: string; // DD/MM/YYYY
  startTime: string; // HH:MM:SS
  pauseTime: string | null; // HH:MM:SS
  resumeTime: string | null; // HH:MM:SS
  stopTime: string | null; // HH:MM:SS
  totalTime: string; // HH:MM:SS
};

export async function fetchAttendanceRecords(
  userId: string,
  date: string // ISO date string (YYYY-MM-DD)
): Promise<AttendanceRecord[]> {
  const response = await api.get<AttendanceRecord[]>('/emp/attendance', {
    params: {
      userId,
      date,
    },
  });
  return response.data;
}

export async function recordShiftAction(payload: ShiftActionPayload): Promise<ShiftActionResponse> {
  const response = await api.post<ShiftActionResponse>('/emp/attendance', payload);
  return response.data;
}

export async function fetchAttendanceByOrganization(
  organizationId: string
): Promise<AttendanceShift[]> {
  const response = await api.get<AttendanceShift[]>(
    `/emp/attendance/organization/${organizationId}`
  );
  return response.data;
}

export function extractAttendanceErrorMessage(error: unknown): string {
  if (!error) {
    return 'אירעה שגיאה לא ידועה';
  }

  const axiosError = error as AxiosError<AttendanceErrorResponse>;
  const responseMessage = axiosError.response?.data?.message;
  if (typeof responseMessage === 'string') {
    return responseMessage;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return 'אירעה שגיאה לא ידועה';
}

