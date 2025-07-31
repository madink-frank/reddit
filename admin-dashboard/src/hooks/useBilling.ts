import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../utils/notifications';
import {
  billingService,
  AddPointsRequest,
  DeductPointsRequest,
  SpendingLimitsRequest
} from '../services/billingService';

// Query keys
const BILLING_KEYS = {
  balance: ['billing', 'balance'] as const,
  transactions: (limit: number, offset: number, type?: string) =>
    ['billing', 'transactions', limit, offset, type] as const,
  analytics: (days: number) => ['billing', 'analytics', days] as const,
  operationCosts: ['billing', 'operation-costs'] as const,
};

export function useBilling() {
  const queryClient = useQueryClient();

  // Get user balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch: refetchBalance
  } = useQuery({
    queryKey: BILLING_KEYS.balance,
    queryFn: () => billingService.getUserBalance(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Get operation costs
  const {
    data: operationCosts,
    isLoading: isLoadingCosts
  } = useQuery({
    queryKey: BILLING_KEYS.operationCosts,
    queryFn: () => billingService.getOperationCosts(),
    staleTime: 300000, // 5 minutes (costs don't change often)
  });

  // Add points mutation
  const addPointsMutation = useMutation({
    mutationFn: (request: AddPointsRequest) => billingService.addPoints(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.balance });
      queryClient.invalidateQueries({ queryKey: ['billing', 'transactions'] });
      toast.success(`Successfully added ${billingService.formatPoints(data.amount)} points`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add points');
    },
  });

  // Deduct points mutation
  const deductPointsMutation = useMutation({
    mutationFn: (request: DeductPointsRequest) => billingService.deductPoints(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.balance });
      queryClient.invalidateQueries({ queryKey: ['billing', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'analytics'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 402) {
        toast.error('Insufficient points for this operation');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to deduct points');
      }
    },
  });

  // Update spending limits mutation
  const updateSpendingLimitsMutation = useMutation({
    mutationFn: (request: SpendingLimitsRequest) => billingService.updateSpendingLimits(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.balance });
      toast.success('Spending limits updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update spending limits');
    },
  });

  // Helper functions
  const addPoints = useCallback((request: AddPointsRequest) => {
    return addPointsMutation.mutateAsync(request);
  }, [addPointsMutation]);

  const deductPoints = useCallback((request: DeductPointsRequest) => {
    return deductPointsMutation.mutateAsync(request);
  }, [deductPointsMutation]);

  const updateSpendingLimits = useCallback((request: SpendingLimitsRequest) => {
    return updateSpendingLimitsMutation.mutateAsync(request);
  }, [updateSpendingLimitsMutation]);

  const checkSpendingLimits = useCallback(async (amount: number) => {
    try {
      return await billingService.checkSpendingLimits(amount);
    } catch (error: any) {
      toast.error('Failed to check spending limits');
      throw error;
    }
  }, []);

  const getOperationCost = useCallback((operationType: string): number => {
    return operationCosts?.operation_costs[operationType] || 0.1;
  }, [operationCosts]);

  const canAffordOperation = useCallback((operationType: string): boolean => {
    if (!balance || !operationCosts) return false;
    const cost = getOperationCost(operationType);
    return balance.current_points >= cost;
  }, [balance, operationCosts, getOperationCost]);

  const isBalanceLow = useCallback((): boolean => {
    if (!balance) return false;
    return billingService.isBalanceLow(balance.current_points, balance.low_balance_threshold);
  }, [balance]);

  const getBalanceStatus = useCallback(() => {
    if (!balance) return 'normal';
    return billingService.getBalanceStatus(balance.current_points, balance.low_balance_threshold);
  }, [balance]);

  return {
    // Data
    balance,
    operationCosts,

    // Loading states
    isLoadingBalance,
    isLoadingCosts,
    isAddingPoints: addPointsMutation.isPending,
    isDeductingPoints: deductPointsMutation.isPending,
    isUpdatingLimits: updateSpendingLimitsMutation.isPending,

    // Error states
    balanceError,

    // Actions
    addPoints,
    deductPoints,
    updateSpendingLimits,
    checkSpendingLimits,
    refetchBalance,

    // Helper functions
    getOperationCost,
    canAffordOperation,
    isBalanceLow,
    getBalanceStatus,

    // Formatters
    formatPoints: billingService.formatPoints,
    formatCurrency: billingService.formatCurrency,
    getTransactionTypeDisplay: billingService.getTransactionTypeDisplay,
    getOperationTypeDisplay: billingService.getOperationTypeDisplay,
    getStatusColor: billingService.getStatusColor,
  };
}

export function useTransactionHistory(
  limit: number = 50,
  offset: number = 0,
  transactionType?: string
) {
  return useQuery({
    queryKey: BILLING_KEYS.transactions(limit, offset, transactionType),
    queryFn: () => billingService.getTransactionHistory(limit, offset, transactionType),
    staleTime: 60000, // 1 minute
  });
}

export function useUsageAnalytics(days: number = 30) {
  return useQuery({
    queryKey: BILLING_KEYS.analytics(days),
    queryFn: () => billingService.getUsageAnalytics(days),
    staleTime: 300000, // 5 minutes
  });
}