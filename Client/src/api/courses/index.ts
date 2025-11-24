import { createApiService } from "@/api/utils/apiFactory";
import { Course } from "@/types/courses/Course";

export const coursesApi = createApiService<Course>("/courses", {
  includeOrgId: true,
  customRoutes: {
    fetch: (id: string) => ({
      url: `/courses/${id}`,
    }),
  },
});

