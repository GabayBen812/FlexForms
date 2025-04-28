import { createApiService } from "@/api/utils/apiFactory";
import { MutationResponse } from "@/types/api/auth";
import { Department } from "@/types/api/departments";

import { ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";

// Define the full API service
const departmentsApi = createApiService<Department>("/departments", {
  includeOrgId: true,
  customRoutes: {
    delete: (id: number) => ({
      url: "/departments",
      params: { departmentId: id },
    }),
  },
});

const deleteDepartment = async (
  id: number
): Promise<MutationResponse<null>> => {
  const response = await departmentsApi.delete(id);
  return response;
};

// Optional: individual exports if you want to keep your previous API shape
export const fetchDepartments = async (): Promise<
  MutationResponse<Department[]>
> =>
  departmentsApi.fetchAll({}, true) as Promise<MutationResponse<Department[]>>;

export const fetchDepartmentsParams = async (
  params: ApiQueryParams
): Promise<ApiResponse<Department>> =>
  departmentsApi.fetchAll(params, true) as Promise<ApiResponse<Department>>;

export const createNewDepartment = departmentsApi.create;
export const updateDepartment = (data: Department) => {
  return departmentsApi.update(data);
};
export { deleteDepartment };

// Or just export the entire thing:
export default departmentsApi;
