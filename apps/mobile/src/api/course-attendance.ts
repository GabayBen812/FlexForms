import { api } from './client';

export type CourseAttendance = {
  _id?: string;
  id?: string;
  courseId: string;
  kidId: string | { _id: string };
  date: string; // ISO date string
  attended: boolean;
  notes?: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCourseAttendanceDto = {
  organizationId: string;
  courseId: string;
  kidId: string;
  date: string; // ISO date string
  attended?: boolean;
  notes?: string;
};

export type AggregatedAttendance = {
  arrived: number;
  notArrived: number;
};

export const courseAttendanceApi = {
  fetchByCourseAndDate: async (
    courseId: string,
    date: string
  ): Promise<CourseAttendance[]> => {
    // The server extracts organizationId from JWT token in req.user
    const response = await api.get<CourseAttendance[]>(
      `/course-attendance/course/${courseId}/date/${date}`
    );
    return response.data ?? [];
  },

  createOrUpdate: async (
    data: CreateCourseAttendanceDto
  ): Promise<CourseAttendance> => {
    // The server extracts organizationId from JWT token in req.user
    const response = await api.post<CourseAttendance>(
      `/course-attendance`,
      data
    );
    return response.data;
  },

  fetchAggregatedAttendance: async (
    date: string
  ): Promise<AggregatedAttendance> => {
    // The server extracts organizationId from JWT token in req.user
    const response = await api.get<AggregatedAttendance>(
      `/course-attendance/aggregate/${date}`
    );
    return response.data ?? { arrived: 0, notArrived: 0 };
  },
};

