import { createApiService } from "@/api/utils/apiFactory";
import { MutationResponse } from "@/types/api/auth";
import { CallCategory } from "@/types/api/calls";
import { ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";

const callCategoryApi = createApiService<CallCategory>("/calls/categories", {
  includeOrgId: true,
  customRoutes: {},
});

// export const fetchCallCategories = callCategoryApi.fetchAll();

export const fetchCallCategories = async (): Promise<
  MutationResponse<CallCategory[]>
> => callCategoryApi.fetchAll() as Promise<MutationResponse<CallCategory[]>>;

export const fetchCallCategoriesParams = async (
  params: ApiQueryParams
): Promise<ApiResponse<CallCategory>> =>
  callCategoryApi.fetchAll(params, true) as Promise<ApiResponse<CallCategory>>;

export const createCallCategory = callCategoryApi.create;

export const deleteCallCategory = callCategoryApi.delete;

export const updateCallCategory = callCategoryApi.update;
