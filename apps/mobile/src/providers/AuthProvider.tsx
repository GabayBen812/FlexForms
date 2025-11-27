import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchCurrentUser, login, logout, type LoginPayload } from '../api/auth';
import type { ApiUser } from '../api/client';
import { extractErrorMessage } from '../api/auth';
import { getAuthCookie } from '../utils/authCookie';

type AuthContextValue = {
  user: ApiUser | null;
  isLoadingUser: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  loginError: string | null;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_QUERY_KEY = ['auth', 'user'] as const;

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      await getAuthCookie();
      setIsReady(true);
    };

    bootstrap();
  }, []);

  const {
    data: user,
    isLoading: isFetchingUser,
    isFetching,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: isReady,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onMutate: async () => {
      setLoginError(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
    onError: (error) => {
      setLoginError(extractErrorMessage(error));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoadingUser: !isReady || isFetchingUser || isFetching,
      login: async (payload: LoginPayload) => loginMutation.mutateAsync(payload),
      loginError,
      logout: async () => logoutMutation.mutateAsync(),
      isLoggingIn: loginMutation.isPending,
    }),
    [isReady, isFetchingUser, isFetching, user, loginMutation, loginError, logoutMutation]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}


