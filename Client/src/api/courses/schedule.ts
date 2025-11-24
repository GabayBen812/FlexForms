import apiClient from "@/api/apiClient";
import { CourseSchedule, CreateCourseScheduleDto, UpsertCourseScheduleListDto } from "@/types/courses/Course";
import { MutationResponse } from "@/types/api/auth";

export const courseScheduleApi = {
  fetchSchedule: async (courseId: string): Promise<MutationResponse<CourseSchedule[]>> => {
    try {
      const response = await apiClient.get<CourseSchedule[]>(
        `/courses/${courseId}/schedule`
      );
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message || "Failed to fetch schedule",
        data: [],
      };
    }
  },

  saveSchedule: async (
    courseId: string,
    organizationId: string,
    schedules: CreateCourseScheduleDto[]
  ): Promise<MutationResponse<CourseSchedule[]>> => {
    try {
      const payload: UpsertCourseScheduleListDto = {
        courseId,
        organizationId,
        schedules: schedules.map((schedule) => ({
          ...schedule,
          courseId,
          organizationId,
        })),
      };

      const response = await apiClient.put<CourseSchedule[]>(
        `/courses/${courseId}/schedule`,
        payload
      );
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message || "Failed to save schedule",
        data: [],
      };
    }
  },

  deleteSchedule: async (
    courseId: string,
    scheduleId: string
  ): Promise<MutationResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(
        `/courses/${courseId}/schedule/${scheduleId}`
      );
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message || "Failed to delete schedule",
        data: null,
      };
    }
  },
};

