import { api } from './client';

export type Course = {
  _id: string;
  name: string;
  organizationId: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CourseSession = {
  _id: string;
  courseId: string | { _id: string; name: string };
  scheduleId: string;
  organizationId: string;
  date: string | Date;
  startDateTime: string | Date;
  endDateTime: string | Date;
  status: 'NORMAL' | 'CANCELLED' | 'MOVED' | 'TIME_CHANGED';
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchCourses(): Promise<Course[]> {
  // The server extracts organizationId from JWT token in req.user
  // No need to send it explicitly - it's handled by JwtAuthGuard
  const response = await api.get<Course[]>('/courses');
  return response.data ?? [];
}

export async function fetchCourseSessions(courseId?: string): Promise<CourseSession[]> {
  const params = courseId ? { courseId } : {};
  // The server extracts organizationId from JWT token in req.user
  const response = await api.get<CourseSession[]>('/course-sessions', { params });
  return response.data ?? [];
}

export type CourseEnrollment = {
  _id: string;
  courseId: string | { _id: string; name: string };
  kidId: string | { _id: string; firstname: string; lastname: string; profileImageUrl?: string };
  kid?: { _id: string; firstname: string; lastname: string; profileImageUrl?: string };
  organizationId: string;
  enrollmentDate: string | Date;
};

export async function fetchCourseEnrollments(courseId?: string): Promise<CourseEnrollment[]> {
  const params = courseId ? { courseId } : {};
  // The server extracts organizationId from JWT token in req.user
  const response = await api.get<CourseEnrollment[]>('/course-enrollments', { params });
  return response.data ?? [];
}

export type CourseSchedule = {
  _id: string;
  courseId: string;
  organizationId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchCourseSchedule(courseId: string): Promise<CourseSchedule[]> {
  // The server extracts organizationId from JWT token in req.user
  const response = await api.get<CourseSchedule[]>(`/courses/${courseId}/schedule`);
  return response.data ?? [];
}

