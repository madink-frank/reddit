import { apiClient } from './api';
import { AuthTokens, LoginRequest, User } from '../types';

export class AuthService {
  async login(loginData: LoginRequest): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/auth/login', loginData);
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.clearAuth();
    }
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return apiClient.post<AuthTokens>('/auth/refresh', {
      refresh_token: refreshToken,
    });
  }

  getRedditAuthUrl(): string {
    const clientId = import.meta.env.VITE_REDDIT_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_REDDIT_REDIRECT_URI;
    const state = Math.random().toString(36).substring(2, 15);
    
    localStorage.setItem('reddit_auth_state', state);
    
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      state,
      redirect_uri: redirectUri,
      duration: 'permanent',
      scope: 'identity read',
    });

    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  }

  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }
}

export const authService = new AuthService();