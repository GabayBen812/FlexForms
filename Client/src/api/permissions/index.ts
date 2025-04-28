import { MutationResponse } from "@/types/api/auth";
import { createApiService } from "../utils/apiFactory";
import { Permissions } from "@/types/api/roles";

const permissionsApi = createApiService<Permissions>("/permissions", {
  includeOrgId: true,
  customRoutes: {
    fetch: (roleId: number) => ({ url: "/permissions", params: { roleId } }),
  },
});

export const fetchPermissions = async (
  id: number
): Promise<MutationResponse<Permissions>> => permissionsApi.fetch(id);

export const updatePermissions = (data: Permissions) => {
  return permissionsApi.update(data);
};
export const deletePermission = permissionsApi.delete;
