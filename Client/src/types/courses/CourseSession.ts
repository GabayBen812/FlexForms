export type CourseSessionStatus = 'NORMAL' | 'CANCELLED' | 'MOVED' | 'TIME_CHANGED';

export interface CourseSession {
  _id: string;
  organizationId: string;
  courseId: string;
  scheduleId: string;
  date: string; // ISO date string
  startDateTime: string; // ISO date string
  endDateTime: string; // ISO date string
  status: CourseSessionStatus;
  createdAt?: string;
  updatedAt?: string;
}

