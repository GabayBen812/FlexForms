import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { User } from "@/types/api/user";
import {
  LoginCredentials,
  LoginResponse,
  MutationResponse,
} from "@/types/api/auth";
import { fetchUser } from "@/api/users/fetchUser";
import { login } from "@/api/auth";
import { toast } from "sonner";

export function useAuth() {
  const queryClient = useQueryClient();

  const userQuery = useQuery<User, Error, User>({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: false,
  });

  const loginMutation = useMutation<MutationResponse, Error, LoginCredentials>({
    mutationFn: login,

    onSuccess: (data) => {
      const response = data.data as LoginResponse;
      queryClient.setQueryData(["user"], response.user);
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (error) => {
      toast.error("פרטי הזדהות שגויים", {
        description: "השם משתמש או הסיסמה שגויים",
        richColors: true,
      });
      console.log(error.message);
    },
  });

  const logout = useMutation<void, Error>({
    mutationFn: () => apiClient.post("/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
    },
  });

  return {
    user: userQuery?.data || null,
    isAuthenticated: !!userQuery.data,
    isUserLoading: userQuery.isLoading, // Loading state for fetching user
    isLoginLoading: loginMutation.status === "pending", // Loading state for login mutation
    login: loginMutation.mutateAsync,
    logout: logout.mutateAsync,
  };
}
