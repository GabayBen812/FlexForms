import { api } from './client';

export type OrganizationUser = {
  _id?: string;
  id?: string | number;
  name: string;
  email: string;
  role: string;
  organizationId: string;
};

export async function fetchOrganizationUsers(
  organizationId: string
): Promise<OrganizationUser[]> {
  const response = await api.get<OrganizationUser[]>('/users', {
    params: {
      organizationId,
      page: 1,
      pageSize: 500,
    },
  });
  return Array.isArray(response.data) ? response.data : [];
}

