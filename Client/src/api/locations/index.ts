import { ApiQueryParams, ApiResponse } from "@/types/ui/data-table-types";
import { createApiService } from "../utils/apiFactory";
import { Location } from "@/types/api/locations";
const locationsApi = createApiService<Location>("/locations", {
  includeOrgId: true,
  customRoutes: {},
});

export const fetchLocationsParams = async (
  params: ApiQueryParams
): Promise<ApiResponse<Location>> =>
  locationsApi.fetchAll(params, true) as Promise<ApiResponse<Location>>;

export const createLocation = locationsApi.create;
export const updateLocation = locationsApi.update;
export const deleteLocation = locationsApi.delete;
