import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import type { DashboardStats } from '../types';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 25000, // Consider data stale after 25 seconds
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['dashboard', 'health'],
    queryFn: dashboardService.getSystemHealth,
    refetchInterval: 15000, // Check health every 15 seconds
    staleTime: 10000,
  });
};

export const useRecentActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: () => dashboardService.getRecentActivity(limit),
    refetchInterval: 20000, // Refresh activity every 20 seconds
    staleTime: 15000,
  });
};