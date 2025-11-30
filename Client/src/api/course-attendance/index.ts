import apiClient from "@/api/apiClient";
import { CourseAttendance, CreateCourseAttendanceDto, BulkUpsertCourseAttendanceDto } from "@/types/courses/CourseAttendance";
import { MutationResponse } from "@/types/api/auth";

export const courseAttendanceApi = {
  fetchByCourseAndDate: async (
    courseId: string,
    date: string
  ): Promise<MutationResponse<CourseAttendance[]>> => {
    try {
      const response = await apiClient.get<CourseAttendance[]>(
        `/course-attendance/course/${courseId}/date/${date}`
      );
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message || "Failed to fetch attendance",
        data: [],
      };
    }
  },

  createOrUpdate: async (
    data: CreateCourseAttendanceDto
  ): Promise<MutationResponse<CourseAttendance>> => {
    try {
      const response = await apiClient.post<CourseAttendance>(
        `/course-attendance`,
        data
      );
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message || "Failed to save attendance",
        data: {} as CourseAttendance,
      };
    }
  },

  bulkUpsert: async (
    data: BulkUpsertCourseAttendanceDto
  ): Promise<MutationResponse<CourseAttendance[]>> => {
    try {
      const response = await apiClient.post<CourseAttendance[]>(
        `/course-attendance/bulk`,
        data
      );
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message || "Failed to save attendance",
        data: [],
      };
    }
  },
};






