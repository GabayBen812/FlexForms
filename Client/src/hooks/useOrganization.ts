import { useQuery } from "@tanstack/react-query";
import { fetchOrganization } from "@/api/organizations";
import { useAuth } from "@/hooks/useAuth";
import { QueryFunction } from '@tanstack/react-query';

export function useOrganization() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["organization"],
    queryFn: () => fetchOrganization(),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  

  return {
    organization: data?.data,
    isOrganizationFetching: isFetching,
    refetchOrganization: refetch,
  };
}
