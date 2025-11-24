import { createApiService } from "@/api/utils/apiFactory";
import { CourseEnrollment } from "@/types/courses/CourseEnrollment";

export const courseEnrollmentsApi = createApiService<CourseEnrollment>("/course-enrollments", {
  includeOrgId: true,
});

