import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { User } from '../types';

interface AdminPrivilegesResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  checkPrivileges: () => Promise<void>;
}

export const useAdminPrivileges = (): AdminPrivilegesResult => {
  const { user, isAuthenticated } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAdminPrivileges = async (user: User): Promise<boolean> => {
    try {
      // Method 1: Check against admin whitelist from environment
      const adminUsernames = import.meta.env.VITE_ADMIN_USERNAMES?.split(',').map((u: string) => u.trim().toLowerCase()) || [];
      const isWhitelisted = adminUsernames.includes(user.username?.toLowerCase());
      
      if (isWhitelisted) {
        return true;
      }

      // Method 2: Check user role/permissions from backend
      if (user.role === 'admin' || user.is_admin === true) {
        return true;
      }

      // Method 3: Development mode fallback
      if (import.meta.env.DEV && user.username?.toLowerCase() === 'test_admin') {
        return true;
      }

      // Method 4: Check specific Reddit user IDs (if configured)
      const adminRedditIds = import.meta.env.VITE_ADMIN_REDDIT_IDS?.split(',').map((id: string) => id.trim()) || [];
      if (adminRedditIds.length > 0 && adminRedditIds.includes(user.reddit_id)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking admin privileges:', error);
      throw new Error('Failed to verify admin privileges');
    }
  };

  const checkPrivileges = async (): Promise<void> => {
    if (!user || !isAuthenticated) {
      setIsAdmin(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const adminStatus = await checkAdminPrivileges(user);
      setIsAdmin(adminStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkPrivileges();
  }, [user, isAuthenticated]);

  return {
    isAdmin,
    isLoading,
    error,
    checkPrivileges,
  };
};

// Helper function for quick admin checks
export const isUserAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;

  try {
    const adminUsernames = import.meta.env.VITE_ADMIN_USERNAMES?.split(',').map((u: string) => u.trim().toLowerCase()) || [];
    const isWhitelisted = adminUsernames.includes(user.username?.toLowerCase());
    
    if (isWhitelisted) return true;
    
    if (user.role === 'admin' || user.is_admin === true) return true;
    
    if (import.meta.env.DEV && user.username?.toLowerCase() === 'test_admin') return true;
    
    const adminRedditIds = import.meta.env.VITE_ADMIN_REDDIT_IDS?.split(',').map((id: string) => id.trim()) || [];
    if (adminRedditIds.length > 0 && adminRedditIds.includes(user.reddit_id)) return true;
    
    return false;
  } catch (error) {
    console.error('Error in isUserAdmin check:', error);
    return false;
  }
};