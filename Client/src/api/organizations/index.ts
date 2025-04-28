import { createApiService } from "@/api/utils/apiFactory";
import { MutationResponse } from "@/types/api/auth";
import { Organization } from "@/types/api/organization";

// Define the full API service
const organizationsApi = createApiService<Organization>("/organizations", {
  includeOrgId: true,
  customRoutes: {
    fetch: () => ({ url: "/organizations/find" }),
  },
});

export const fetchOrganizations = async (): Promise<
  MutationResponse<Organization[]>
> => organizationsApi.fetchAll() as Promise<MutationResponse<Organization[]>>;

export const fetchOrganization = async (): Promise<
  MutationResponse<Organization>
> => organizationsApi.fetch() as Promise<MutationResponse<Organization>>;

export const createNewOrganization = organizationsApi.create;

export const deleteOrganization = organizationsApi.delete;

export const updateOrganization = (data: Partial<Organization>) =>
  organizationsApi.update(data);

export default organizationsApi;
