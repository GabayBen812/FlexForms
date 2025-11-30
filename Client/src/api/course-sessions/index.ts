import { createApiService } from "@/api/utils/apiFactory";
import { CourseSession } from "@/types/courses/CourseSession";

export const courseSessionsApi = createApiService<CourseSession>("/course-sessions", {
  includeOrgId: true,
});






