import apiClient from "@/api/apiClient";
import { MutationResponse } from "@/types/api/auth";
import { UpdateUserPayload, User } from "@/types/users/user";
import { handleApiError } from "../configs";
export const updateUser = async (
  data: UpdateUserPayload
): Promise<MutationResponse<User>> => {
  try {
    const response = await apiClient.patch<User>("/users", data);
    return { status: response.status, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};
