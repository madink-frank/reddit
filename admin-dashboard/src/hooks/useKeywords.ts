import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keywordService, type KeywordListParams } from '../services/keywordService';
import { queryKeys, queryErrorHandler, optimisticUpdates } from '../lib/react-query';
import type { Keyword, KeywordCreate, KeywordUpdate } from '../types';

// Query hooks
export const useKeywords = (params?: KeywordListParams) => {
  return useQuery({
    queryKey: queryKeys.keywords.list(params),
    queryFn: () => keywordService.getKeywords(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    throwOnError: queryErrorHandler,
  });
};

export const useKeyword = (id: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.keywords.detail(id),
    queryFn: () => keywordService.getKeyword(id),
    enabled: enabled && id > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    throwOnError: queryErrorHandler,
  });
};

export const useKeywordStats = (id: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.keywords.stat(id),
    queryFn: () => keywordService.getKeywordStats(id),
    enabled: enabled && id > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    throwOnError: queryErrorHandler,
  });
};

export const useAllKeywordsStats = () => {
  return useQuery({
    queryKey: queryKeys.keywords.stats(),
    queryFn: keywordService.getAllKeywordsStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    throwOnError: queryErrorHandler,
  });
};

export const useCheckKeywordExists = (keyword: string, enabled = false) => {
  return useQuery({
    queryKey: ['keywords', 'check', keyword],
    queryFn: () => keywordService.checkKeywordExists(keyword),
    enabled: enabled && keyword.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    throwOnError: queryErrorHandler,
  });
};

// Mutation hooks
export const useCreateKeyword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: KeywordCreate) => keywordService.createKeyword(data),
    onMutate: async (newKeyword) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.keywords.lists() });
      
      // Snapshot previous value
      const previousKeywords = queryClient.getQueryData(queryKeys.keywords.lists());
      
      // Optimistically update
      const optimisticKeyword = {
        id: Date.now(), // Temporary ID
        ...newKeyword,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        post_count: 0,
      };
      
      optimisticUpdates.addKeyword(optimisticKeyword);
      
      return { previousKeywords };
    },
    onError: (err, newKeyword, context) => {
      // Rollback on error
      if (context?.previousKeywords) {
        queryClient.setQueryData(queryKeys.keywords.lists(), context.previousKeywords);
      }
      queryErrorHandler(err);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords.stats() });
    },
  });
};

export const useUpdateKeyword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: KeywordUpdate }) => 
      keywordService.updateKeyword(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.keywords.detail(id) });
      
      // Snapshot previous value
      const previousKeyword = queryClient.getQueryData(queryKeys.keywords.detail(id));
      
      // Optimistically update
      optimisticUpdates.updateKeyword(id, data);
      
      return { previousKeyword, id };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousKeyword) {
        queryClient.setQueryData(queryKeys.keywords.detail(id), context.previousKeyword);
      }
      queryErrorHandler(err);
    },
    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords.stats() });
    },
  });
};

export const useDeleteKeyword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => keywordService.deleteKeyword(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.keywords.lists() });
      
      // Snapshot previous value
      const previousKeywords = queryClient.getQueryData(queryKeys.keywords.lists());
      
      // Optimistically update
      optimisticUpdates.removeKeyword(id);
      
      return { previousKeywords, id };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousKeywords) {
        queryClient.setQueryData(queryKeys.keywords.lists(), context.previousKeywords);
      }
      queryErrorHandler(err);
    },
    onSettled: (data, error, id) => {
      // Remove from cache and refetch lists
      queryClient.removeQueries({ queryKey: queryKeys.keywords.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords.stats() });
    },
  });
};

export const useBulkDeleteKeywords = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids: number[]) => keywordService.bulkDeleteKeywords(ids),
    onSuccess: () => {
      // Invalidate all keyword-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords.all });
    },
    onError: queryErrorHandler,
  });
};

export const useBulkUpdateKeywords = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: number[]; updates: Partial<KeywordUpdate> }) => 
      keywordService.bulkUpdateKeywords(ids, updates),
    onSuccess: () => {
      // Invalidate all keyword-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords.all });
    },
    onError: queryErrorHandler,
  });
};

export const useExportKeywords = () => {
  return useMutation({
    mutationFn: (format: 'csv' | 'json' = 'csv') => keywordService.exportKeywords(format),
    onError: queryErrorHandler,
  });
};