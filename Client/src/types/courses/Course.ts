export interface Course {
  _id: string;
  name: string;
  organizationId: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseSchedule {
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
}

export interface CreateCourseScheduleDto {
  courseId: string;
  organizationId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface UpsertCourseScheduleListDto {
  courseId: string;
  organizationId: string;
  schedules: CreateCourseScheduleDto[];
}

