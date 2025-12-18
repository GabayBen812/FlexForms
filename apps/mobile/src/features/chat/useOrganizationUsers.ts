import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../../providers/AuthProvider';
import { fetchOrganizationUsers, type OrganizationUser } from '../../api/users';

const USERS_QUERY_KEY = ['chat', 'organization-users'] as const;

export function useOrganizationUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...USERS_QUERY_KEY, user?.organizationId],
    queryFn: () => fetchOrganizationUsers(user!.organizationId!),
    enabled: Boolean(user?.organizationId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export type { OrganizationUser };






