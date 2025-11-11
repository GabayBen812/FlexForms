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
import { useAnalytics } from "@/hooks/useAnalytics";

export function useAuth() {
  const queryClient = useQueryClient();
  const {
    trackEvent,
    identifyUser,
    setUserProfile,
    registerSuperProperties,
    unregisterSuperProperty,
  } = useAnalytics();

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
    onSuccess: (data, variables) => {
      if (data.data?.user?._id) {
        identifyUser(String(data.data.user._id));
        setUserProfile({
          email: data.data.user.email,
          name: data.data.user.name,
          organizationId: data.data.user.organizationId,
          role: data.data.user.role,
        });
        registerSuperProperties({
          organizationId: data.data.user.organizationId,
          role: data.data.user.role,
        });
      } else {
        unregisterSuperProperty("organizationId");
        unregisterSuperProperty("role");
      }

      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ["user"] });
        trackEvent("auth:login_success", {
          properties: {
            email: variables.email,
            status: data.status,
          },
        });
      } else {
        toast.error("פרטי הזדהות שגויים", {
          description: data.error || "השם משתמש או הסיסמה שגויים",
          richColors: true,
        });
        trackEvent("auth:login_failure", {
          properties: {
            email: variables.email,
            reason: data.error || "unknown_error",
          },
        });
      }
    },
    onError: (error, variables) => {
      toast.error("שגיאה בהתחברות", {
        description: error.message || "אירעה שגיאה בעת ההתחברות",
        richColors: true,
      });
      trackEvent("auth:login_error", {
        properties: {
          email: variables?.email,
          message: error.message,
        },
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
