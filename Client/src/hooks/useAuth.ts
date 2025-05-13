import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { User } from "@/types/users/user";
import { LoginCredentials, MutationResponse } from "@/types/api/auth";
import { fetchUser } from "@/api/users/fetchUser";
import { login } from "@/api/auth";
import { toast } from "sonner";
export function useAuth() {
  const queryClient = useQueryClient();

  const userQuery = useQuery<User | null, Error>({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const loginMutation = useMutation<MutationResponse, Error, LoginCredentials>({
    mutationFn: login,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
    onError: () => {
      toast.error("פרטי הזדהות שגויים", {
        description: "השם משתמש או הסיסמה שגויים",
        richColors: true,
      });
    },
  });

  const logout = useMutation<void, Error>({
    mutationFn: () => apiClient.post("/auth/logout"),
    onSuccess: () => queryClient.setQueryData(["user"], null),
  });

  const isUserLoading = userQuery.isLoading || userQuery.isFetching;

  return {
    user: userQuery?.data || null,
    isAuthenticated: !!userQuery.data,
    isLoading: userQuery.isLoading,
    isUserLoading,
    //@ts-ignore
    isLoginLoading: loginMutation.isLoading,
    login: loginMutation.mutateAsync,
    logout: logout.mutateAsync,
  };
  
}
