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
      // Clear any stale cache on startup
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      await getAuthCookie();
      setIsReady(true);
    };

    bootstrap();
  }, [queryClient]);

  const {
    data: user,
    isLoading: isFetchingUser,
    isFetching,
    error,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const userData = await fetchCurrentUser();
        console.log('[AuthProvider] fetchCurrentUser succeeded:', userData);
        return userData;
      } catch (error) {
        // If fetch fails (401, network error, etc), return null
        console.log('[AuthProvider] fetchCurrentUser failed:', error);
        return null;
      }
    },
    enabled: isReady,
    retry: false,
    staleTime: Infinity, // Keep data fresh, don't auto-refetch
    gcTime: Infinity, // Keep in cache
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when app comes to focus
    refetchOnReconnect: false, // Don't refetch on network reconnect
  });

  // Debug logging
  console.log('[AuthProvider] State:', { 
    isReady, 
    isFetchingUser, 
    isFetching, 
    user, 
    isLoadingUser: !isReady || isFetchingUser || isFetching 
  });

  const loginMutation = useMutation({
    mutationFn: async (payload) => {
      console.log('[AuthProvider] Login attempt with:', payload.email);
      return await login(payload);
    },
    onMutate: async () => {
      console.log('[AuthProvider] Login started');
      setLoginError(null);
    },
    onSuccess: async () => {
      console.log('[AuthProvider] Login successful, fetching user data');
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
    onError: (error) => {
      console.log('[AuthProvider] Login failed:', error);
      setLoginError(extractErrorMessage(error));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      // Clear all cached data
      queryClient.clear();
      // Explicitly set user to null
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


