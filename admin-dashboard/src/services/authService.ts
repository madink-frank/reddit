import { apiClient } from './api';
import type { AuthTokens, LoginRequest, User } from '../types';

export class AuthService {
  /**
   * Initiate Reddit OAuth2 login
   */
  async getOAuthUrl(): Promise<{ url: string; state: string }> {
    return apiClient.get('/auth/oauth-url', { skipAuth: true });
  }

  /**
   * Complete OAuth2 login with authorization code
   */
  async login(loginData: LoginRequest): Promise<AuthTokens> {
    const tokens = await apiClient.post<AuthTokens>('/auth/login', loginData, { skipAuth: true });
    apiClient.setAuthTokens(tokens);
    return tokens;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const tokens = await apiClient.post<AuthTokens>('/auth/refresh', {
      refresh_token: refreshToken,
    }, { skipAuth: true });
    apiClient.setAuthTokens(tokens);
    return tokens;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.clearAuth();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  /**
   * Check if user has admin privileges
   */
  async checkAdminPrivileges(): Promise<{ is_admin: boolean; permissions: string[] }> {
    return apiClient.get('/auth/admin-check');
  }

  /**
   * Verify token validity
   */
  async verifyToken(): Promise<{ valid: boolean; expires_at: string }> {
    return apiClient.get('/auth/verify');
  }
}

export const authService = new AuthService();