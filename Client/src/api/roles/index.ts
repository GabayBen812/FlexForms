import { createApiService } from "@/api/utils/apiFactory";
import { MutationResponse } from "@/types/api/auth";
import { Role } from "@/types/api/roles";

import { ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";

const rolesApi = createApiService<Role>("/roles", {
  includeOrgId: true,
  customRoutes: {
    delete: (id: number) => ({ url: "/roles", params: { id } }),
    fetch: (id: number) => ({ url: "/roles/find", params: { id } }),
  },
});

export const deleteRole = async (
  id: number
): Promise<MutationResponse<null>> => {
  const response = await rolesApi.delete(id);
  return response;
};

export const fetchRoles = async (): Promise<MutationResponse<Role[]>> =>
  rolesApi.fetchAll() as Promise<MutationResponse<Role[]>>;

export const fetchRolesParams = async (
  params: ApiQueryParams
): Promise<ApiResponse<Role>> => {
  return rolesApi.fetchAll(params, true) as Promise<ApiResponse<Role>>;
};

export const fetchRole = async (
  id: number
): Promise<MutationResponse<Role>> => {
  return rolesApi.fetch(id) as Promise<MutationResponse<Role>>;
};

export const createRole = rolesApi.create;
export const updateRole = (data: Partial<Role>) => rolesApi.update(data);

export default rolesApi;
