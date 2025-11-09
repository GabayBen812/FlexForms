import { ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";
import { createApiService } from "../utils/apiFactory";
import { MutationResponse } from "@/types/api/auth";
import apiClient from "../apiClient";
import { User } from "@/types/users/user";
const usersApi = createApiService<User>("/users", {
  includeOrgId: true,
  customRoutes: {
    fetch: () => ({ url: "/users/find" }),
  },
});



export const adminUpdateUser = async (data: Partial<User> & { id: number }): Promise<MutationResponse<User>> => {
  const response = await apiClient.put<User>(`/users/${data.id}`, data);
  return {
    status: response.status,
    data: response.data,
  };
};


export const fetchUsers = usersApi.fetchAll();
export const fetchUser = usersApi.fetch();
export const fetchUsersParams = async (
  params: ApiQueryParams,
  organizationId?: string
): Promise<ApiResponse<User>> =>
  usersApi.fetchAll(
    params,
    false,
    organizationId ?? (params.organizationId as string | undefined)
  ) as Promise<ApiResponse<User>>;

export const fetchUsersWithRoles = async (): Promise<ApiResponse<User>> =>
  usersApi.customRequest("get", "/users/roles", {
    includeOrgId: true,
  }) as Promise<ApiResponse<User>>;

export const createUser = usersApi.create;

export const deleteUser = usersApi.delete;

export const updateUser = usersApi.update;
