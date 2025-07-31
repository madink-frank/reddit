import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/api';
import { queryKeys, queryErrorHandler } from '../lib/react-query';
import type { AuthTokens, LoginRequest, User } from '../types';

// Query hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: authService.getCurrentUser,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry auth queries
    throwOnError: queryErrorHandler,
  });
};

export const useAdminCheck = () => {
  return useQuery({
    queryKey: queryKeys.auth.adminCheck,
    queryFn: authService.checkAdminPrivileges,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    throwOnError: queryErrorHandler,
  });
};

export const useVerifyToken = () => {
  return useQuery({
    queryKey: queryKeys.auth.verify,
    queryFn: authService.verifyToken,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false,
    throwOnError: queryErrorHandler,
  });
};

// Mutation hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (loginData: LoginRequest) => authService.login(loginData),
    onSuccess: (tokens: AuthTokens) => {
      // Invalidate auth queries to refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.adminCheck });
      
      // Dispatch login event
      window.dispatchEvent(new CustomEvent('auth:login', { 
        detail: { tokens } 
      }));
    },
    onError: queryErrorHandler,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout', { 
        detail: { reason: 'user_initiated' } 
      }));
    },
    onError: queryErrorHandler,
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (refreshToken: string) => authService.refreshToken(refreshToken),
    onSuccess: (tokens: AuthTokens) => {
      // Update user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
      
      // Dispatch token refresh event
      window.dispatchEvent(new CustomEvent('auth:token-refreshed', { 
        detail: { tokens } 
      }));
    },
    onError: queryErrorHandler,
  });
};

// OAuth URL hook
export const useOAuthUrl = () => {
  return useQuery({
    queryKey: ['auth', 'oauth-url'],
    queryFn: authService.getOAuthUrl,
    staleTime: 0, // Always fresh
    gcTime: 0, // Don't cache
    enabled: false, // Only fetch when explicitly called
  });
};