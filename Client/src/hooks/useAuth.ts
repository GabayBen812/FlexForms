import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { User } from "@/types/users/user";
import {
  LoginCredentials,
  MutationResponse,
  LoginResponse,
} from "@/types/api/auth";
import { fetchUser } from "@/api/users/fetchUser";
import { login } from "@/api/auth";
import { toast } from "@/hooks/use-toast";

export function useAuth() {
  const queryClient = useQueryClient();

  const userQuery = useQuery<User | null, Error>({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const loginMutation = useMutation<
    MutationResponse<LoginResponse>,
    Error,
    LoginCredentials
  >({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ["user"] });
      } else {
        toast.error("פרטי הזדהות שגויים", {
          description: data.error || "השם משתמש או הסיסמה שגויים",
          richColors: true,
        });
      }
    },
    onError: (error) => {
      toast.error("שגיאה בהתחברות", {
        description: error.message || "אירעה שגיאה בעת ההתחברות",
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
    isLoginLoading: loginMutation.isPending,
    login: loginMutation.mutateAsync,
    logout: logout.mutateAsync,
  };
}
