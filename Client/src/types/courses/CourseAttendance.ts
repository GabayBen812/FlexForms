export interface CourseAttendance {
  _id?: string;
  id?: string;
  courseId: string;
  kidId: string;
  date: string; // ISO date string
  attended: boolean;
  notes?: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseAttendanceDto {
  organizationId: string;
  courseId: string;
  kidId: string;
  date: string; // ISO date string
  attended?: boolean;
  notes?: string;
}

export interface BulkUpsertCourseAttendanceDto {
  organizationId: string;
  courseId: string;
  date: string; // ISO date string
  records: CreateCourseAttendanceDto[];
}

