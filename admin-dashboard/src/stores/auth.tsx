import React, { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '../types';
import { authService } from '../services/auth';
import { apiClient } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: AuthTokens | null;
  tokenExpiresAt: number | null;
  autoLogoutTimer: NodeJS.Timeout | null;
  
  // Actions
  login: (tokens: AuthTokens) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuth: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  scheduleAutoLogout: () => void;
  clearAutoLogout: () => void;
  isTokenExpired: () => boolean;
  isTokenExpiringSoon: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokens: null,
      tokenExpiresAt: null,
      autoLogoutTimer: null,

      login: async (tokens: AuthTokens) => {
        try {
          set({ isLoading: true, error: null });
          
          // Calculate token expiration time
          const expiresAt = Date.now() + (tokens.expires_in * 1000);
          
          // Store tokens in API client
          apiClient.setAuthTokens(tokens);
          
          // Fetch user data
          const user = await authService.getCurrentUser();
          
          set({
            user,
            tokens,
            tokenExpiresAt: expiresAt,
            isAuthenticated: true,
            isLoading: false,
          });

          // Schedule auto logout and token refresh
          get().scheduleAutoLogout();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        const state = get();
        
        // Clear auto logout timer
        if (state.autoLogoutTimer) {
          clearTimeout(state.autoLogoutTimer);
        }
        
        // Call auth service logout
        authService.logout();
        
        set({
          user: null,
          tokens: null,
          tokenExpiresAt: null,
          autoLogoutTimer: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          
          const state = get();
          
          // Check if token is expired
          if (state.isTokenExpired()) {
            // Try to refresh token
            try {
              await state.refreshTokens();
            } catch (refreshError) {
              // If refresh fails, logout
              state.logout();
              set({ isLoading: false });
              return;
            }
          }
          
          if (authService.isAuthenticated()) {
            const user = await authService.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            
            // Schedule auto logout
            state.scheduleAutoLogout();
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication check failed',
          });
        }
      },

      refreshTokens: async () => {
        try {
          const state = get();
          
          if (!state.tokens?.refresh_token) {
            throw new Error('No refresh token available');
          }

          const newTokens = await authService.refreshToken();
          const expiresAt = Date.now() + (newTokens.expires_in * 1000);
          
          // Update tokens in API client
          apiClient.setAuthTokens(newTokens);
          
          set({
            tokens: newTokens,
            tokenExpiresAt: expiresAt,
            error: null,
          });

          // Reschedule auto logout
          state.scheduleAutoLogout();
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
          throw error;
        }
      },

      scheduleAutoLogout: () => {
        const state = get();
        
        // Clear existing timer
        if (state.autoLogoutTimer) {
          clearTimeout(state.autoLogoutTimer);
        }
        
        if (!state.tokenExpiresAt) return;
        
        // Calculate time until token expires
        const timeUntilExpiry = state.tokenExpiresAt - Date.now();
        
        // Schedule refresh 5 minutes before expiry
        const refreshTime = Math.max(0, timeUntilExpiry - (5 * 60 * 1000));
        
        const timer = setTimeout(async () => {
          try {
            await get().refreshTokens();
          } catch (error) {
            console.error('Auto token refresh failed:', error);
            get().logout();
          }
        }, refreshTime);
        
        set({ autoLogoutTimer: timer });
      },

      clearAutoLogout: () => {
        const state = get();
        if (state.autoLogoutTimer) {
          clearTimeout(state.autoLogoutTimer);
          set({ autoLogoutTimer: null });
        }
      },

      isTokenExpired: () => {
        const state = get();
        if (!state.tokenExpiresAt) return true;
        return Date.now() >= state.tokenExpiresAt;
      },

      isTokenExpiringSoon: () => {
        const state = get();
        if (!state.tokenExpiresAt) return true;
        // Consider token expiring soon if less than 10 minutes remaining
        return Date.now() >= (state.tokenExpiresAt - (10 * 60 * 1000));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tokens: state.tokens,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
    }
  )
);

// Context for auth initialization
const AuthContext = createContext<{ initialized: boolean }>({ initialized: false });

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = React.useState(false);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const clearAutoLogout = useAuthStore((state) => state.clearAutoLogout);
  const isTokenExpiringSoon = useAuthStore((state) => state.isTokenExpiringSoon);
  const refreshTokens = useAuthStore((state) => state.refreshTokens);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setInitialized(true);
    };

    initAuth();
  }, [checkAuth]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearAutoLogout();
    };
  }, [clearAutoLogout]);

  // Periodic token expiration check
  useEffect(() => {
    if (!initialized) return;

    const checkTokenExpiration = async () => {
      if (isTokenExpiringSoon()) {
        try {
          await refreshTokens();
        } catch (error) {
          console.error('Token refresh failed during periodic check:', error);
          logout();
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [initialized, isTokenExpiringSoon, refreshTokens, logout]);

  return (
    <AuthContext.Provider value={{ initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};