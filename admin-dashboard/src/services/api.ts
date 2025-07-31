import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Extend the InternalAxiosRequestConfig to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      requestId?: string;
      startTime?: number;
    };
  }
}
import { AuthTokens } from '../types';
import { cachedFetch, invalidateCache } from '../utils/apiCache';

// Enhanced error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  retries?: number;
  useCache?: boolean;
  cacheTTL?: number;
  metadata?: {
    requestId?: string;
    startTime?: number;
  };
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private requestId = 0;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token, request ID, and logging
    this.client.interceptors.request.use(
      (config) => {
        // Add request ID for tracking
        const requestId = ++this.requestId;
        config.metadata = { requestId, startTime: Date.now() };
        config.headers['X-Request-ID'] = requestId.toString();

        // Add auth token unless explicitly skipped
        const customConfig = config as RequestConfig;
        if (!customConfig.skipAuth) {
          const token = this.getStoredToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`[API Request ${requestId}]`, {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor - handle token refresh, logging, and error transformation
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (import.meta.env.DEV) {
          const requestId = response.config.metadata?.requestId;
          const duration = Date.now() - (response.config.metadata?.startTime || 0);
          console.log(`[API Response ${requestId}]`, {
            status: response.status,
            duration: `${duration}ms`,
            data: response.data,
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as RequestConfig & { _retry?: boolean };

        // Log error in development
        if (import.meta.env.DEV) {
          const requestId = originalRequest?.metadata?.requestId;
          console.error(`[API Error ${requestId}]`, {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
          });
        }

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getStoredRefreshToken();
            if (refreshToken) {
              const newTokens = await this.refreshToken(refreshToken);
              this.setTokens(newTokens);
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            // Dispatch custom event for auth failure
            window.dispatchEvent(new CustomEvent('auth:logout', { 
              detail: { reason: 'token_refresh_failed' } 
            }));
            return Promise.reject(this.handleError(refreshError as AxiosError));
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('token_expires_at', 
      (Date.now() + tokens.expires_in * 1000).toString()
    );
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
  }

  private async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await axios.post(`${this.baseURL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: 500,
      timestamp: new Date().toISOString(),
      path: error.config?.url || '',
    };

    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data as any;
      apiError.status = error.response.status;
      apiError.message = responseData?.detail || responseData?.message || error.message;
      apiError.code = responseData?.code;
      apiError.details = responseData?.details;
    } else if (error.request) {
      // Request was made but no response received
      apiError.status = 0;
      apiError.message = 'Network error - please check your connection';
      apiError.code = 'NETWORK_ERROR';
    } else {
      // Something else happened
      apiError.message = error.message;
      apiError.code = 'REQUEST_ERROR';
    }

    return apiError;
  }

  // Generic HTTP methods with enhanced error handling
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    // Use cached fetch for GET requests if caching is enabled
    if (config?.useCache !== false) {
      const fullUrl = `${this.baseURL}${url}`;
      const token = this.getStoredToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (token && !config?.skipAuth) {
        headers.Authorization = `Bearer ${token}`;
      }

      try {
        return await cachedFetch<T>(fullUrl, {
          method: 'GET',
          headers,
          ttl: config?.cacheTTL,
        });
      } catch (error) {
        // Fallback to regular axios request if cached fetch fails
        console.warn('Cached fetch failed, falling back to axios:', error);
      }
    }

    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    
    // Invalidate related cache entries after successful POST
    if (response.status >= 200 && response.status < 300) {
      this.invalidateRelatedCache(url);
    }
    
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    
    // Invalidate related cache entries after successful PUT
    if (response.status >= 200 && response.status < 300) {
      this.invalidateRelatedCache(url);
    }
    
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    
    // Invalidate related cache entries after successful PATCH
    if (response.status >= 200 && response.status < 300) {
      this.invalidateRelatedCache(url);
    }
    
    return response.data;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    
    // Invalidate related cache entries after successful DELETE
    if (response.status >= 200 && response.status < 300) {
      this.invalidateRelatedCache(url);
    }
    
    return response.data;
  }

  // Utility methods
  getBaseURL(): string {
    return this.baseURL;
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health', { skipAuth: true });
  }

  // Auth methods
  setAuthTokens(tokens: AuthTokens): void {
    this.setTokens(tokens);
  }

  clearAuth(): void {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const expiresAt = localStorage.getItem('token_expires_at');
    
    if (!token || !expiresAt) {
      return false;
    }

    return Date.now() < parseInt(expiresAt);
  }

  // Cache management methods
  private invalidateRelatedCache(url: string): void {
    // Extract resource type from URL to invalidate related cache entries
    const resourceMatch = url.match(/\/([^\/]+)/);
    if (resourceMatch) {
      const resource = resourceMatch[1];
      invalidateCache(new RegExp(`/${resource}`));
    }
  }

  clearAllCache(): void {
    invalidateCache(/./); // Clear all cache entries
  }
}

export const apiClient = new ApiClient();
export default apiClient;

// Re-export all services for convenience
export { authService } from './authService';
export { keywordService } from './keywordService';
export { postService } from './postService';
export { crawlingService } from './crawlingService';
export { analyticsService } from './analyticsService';
export { contentService } from './contentService';