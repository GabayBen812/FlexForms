import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { AuthContext } from "@/contexts/AuthContext";
import { User } from "@/types/users/user";

const USERS_QUERY_KEY = ["chat", "organization-users"] as const;

async function fetchOrganizationUsers(organizationId: string): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/users", {
    params: {
      organizationId,
      page: 1,
      pageSize: 500,
    },
  });
  return Array.isArray(data) ? data : [];
}

export function useOrganizationUsers() {
  const { user } = useContext(AuthContext);

  return useQuery({
    queryKey: [...USERS_QUERY_KEY, user?.organizationId],
    queryFn: () => fetchOrganizationUsers(user!.organizationId!),
    enabled: Boolean(user?.organizationId),
    staleTime: 5 * 60 * 1000,
  });
}


