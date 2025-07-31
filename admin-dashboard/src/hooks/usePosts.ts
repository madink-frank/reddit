import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postService, type PostListParams, type TrendingPostsParams } from '../services/postService';
import { queryKeys, queryErrorHandler } from '../lib/react-query';

// Query hooks
export const usePosts = (params?: PostListParams) => {
  return useQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => postService.getPosts(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    throwOnError: queryErrorHandler,
  });
};

export const usePost = (id: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: () => postService.getPost(id),
    enabled: enabled && id > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    throwOnError: queryErrorHandler,
  });
};

export const useTrendingPosts = (params?: TrendingPostsParams) => {
  return useQuery({
    queryKey: queryKeys.posts.trending(params),
    queryFn: () => postService.getTrendingPosts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    throwOnError: queryErrorHandler,
  });
};

export const useSearchPosts = (query: string, params?: Omit<PostListParams, 'query'>, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.posts.search(query, params),
    queryFn: () => postService.searchPosts(query, params),
    enabled: enabled && query.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    throwOnError: queryErrorHandler,
  });
};

export const usePostsByKeyword = (keywordId: number, params?: Omit<PostListParams, 'keyword_ids'>, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.posts.byKeyword(keywordId, params),
    queryFn: () => postService.getPostsByKeyword(keywordId, params),
    enabled: enabled && keywordId > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    throwOnError: queryErrorHandler,
  });
};

export const usePostsBySubreddit = (subreddit: string, params?: Omit<PostListParams, 'subreddits'>, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.posts.bySubreddit(subreddit, params),
    queryFn: () => postService.getPostsBySubreddit(subreddit, params),
    enabled: enabled && subreddit.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    throwOnError: queryErrorHandler,
  });
};

export const usePostStats = () => {
  return useQuery({
    queryKey: queryKeys.posts.stats(),
    queryFn: postService.getPostStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    throwOnError: queryErrorHandler,
  });
};

export const useSubreddits = () => {
  return useQuery({
    queryKey: queryKeys.posts.subreddits(),
    queryFn: postService.getSubreddits,
    staleTime: 10 * 60 * 1000, // 10 minutes
    throwOnError: queryErrorHandler,
  });
};

// Mutation hooks
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => postService.deletePost(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: queryKeys.posts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.stats() });
    },
    onError: queryErrorHandler,
  });
};

export const useBulkDeletePosts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids: number[]) => postService.bulkDeletePosts(ids),
    onSuccess: () => {
      // Invalidate all post-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
    onError: queryErrorHandler,
  });
};

export const useExportPosts = () => {
  return useMutation({
    mutationFn: ({ params, format }: { params?: PostListParams; format?: 'csv' | 'json' }) => 
      postService.exportPosts(params, format),
    onError: queryErrorHandler,
  });
};