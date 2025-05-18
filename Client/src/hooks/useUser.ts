import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UpdateUserPayload, User } from "@/types/users/user";
import { fetchUsers, updateUser } from "@/api/users/index";
import { MutationResponse } from "@/types/api/auth";
import { QueryFunction } from '@tanstack/react-query';

export function useUser() {
  const queryClient = useQueryClient();
  const allUsersQuery = useQuery<MutationResponse<User[]>>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetchUsers;
      return response as MutationResponse<User[]>;
    },
    enabled: false,
    retry: false,
  });

  const updateUserMutation = useMutation<
    MutationResponse<User>,
    Error,
    UpdateUserPayload
  >({
    mutationFn: updateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  });

  return {
    allUsers: allUsersQuery.data || null,
    isAllUsersLoading: allUsersQuery.isLoading,
    fetchUsersManually: allUsersQuery.refetch,
    updateUser: updateUserMutation.mutateAsync,
    isUpdateUserPending: updateUserMutation.isPending,
  };
}
