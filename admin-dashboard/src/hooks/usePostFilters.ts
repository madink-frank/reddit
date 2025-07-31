import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PostSearchParams } from '../types';

export interface PostFiltersWithSort extends PostSearchParams {
  sort_by?: 'created_utc' | 'score' | 'num_comments' | 'crawled_at';
  sort_order?: 'asc' | 'desc';
}

const DEFAULT_FILTERS: PostFiltersWithSort = {
  page: 1,
  page_size: 20,
  sort_by: 'created_utc',
  sort_order: 'desc'
};

export const usePostFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<PostSearchParams>(DEFAULT_FILTERS);

  // Parse URL parameters on mount and when URL changes
  useEffect(() => {
    const urlFilters: PostFiltersWithSort = { ...DEFAULT_FILTERS };

    // Parse query parameters
    const query = searchParams.get('q');
    if (query) urlFilters.query = query;

    const page = searchParams.get('page');
    if (page) urlFilters.page = parseInt(page, 10) || 1;

    const pageSize = searchParams.get('page_size');
    if (pageSize) urlFilters.page_size = parseInt(pageSize, 10) || 20;

    const keywordIds = searchParams.get('keywords');
    if (keywordIds) {
      urlFilters.keyword_ids = keywordIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    }

    const subreddits = searchParams.get('subreddits');
    if (subreddits) {
      urlFilters.subreddits = subreddits.split(',');
    }

    const dateFrom = searchParams.get('date_from');
    if (dateFrom) urlFilters.date_from = dateFrom;

    const dateTo = searchParams.get('date_to');
    if (dateTo) urlFilters.date_to = dateTo;

    const minScore = searchParams.get('min_score');
    if (minScore) urlFilters.min_score = parseInt(minScore, 10) || undefined;

    const sortBy = searchParams.get('sort_by');
    if (sortBy && ['created_utc', 'score', 'num_comments', 'crawled_at'].includes(sortBy)) {
      urlFilters.sort_by = sortBy as 'created_utc' | 'score' | 'num_comments' | 'crawled_at';
    }

    const sortOrder = searchParams.get('sort_order');
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      urlFilters.sort_order = sortOrder as 'asc' | 'desc';
    }

    setFilters(urlFilters);
  }, [searchParams]);

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: PostFiltersWithSort) => {
    setFilters(newFilters);

    const params = new URLSearchParams();

    // Add non-empty parameters to URL
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    if (newFilters.page_size && newFilters.page_size !== 20) params.set('page_size', newFilters.page_size.toString());
    if (newFilters.keyword_ids?.length) params.set('keywords', newFilters.keyword_ids.join(','));
    if (newFilters.subreddits?.length) params.set('subreddits', newFilters.subreddits.join(','));
    if (newFilters.date_from) params.set('date_from', newFilters.date_from);
    if (newFilters.date_to) params.set('date_to', newFilters.date_to);
    if (newFilters.min_score) params.set('min_score', newFilters.min_score.toString());
    if (newFilters.sort_by && newFilters.sort_by !== 'created_utc') params.set('sort_by', newFilters.sort_by);
    if (newFilters.sort_order && newFilters.sort_order !== 'desc') params.set('sort_order', newFilters.sort_order);

    setSearchParams(params);
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    updateFilters(DEFAULT_FILTERS);
  }, [updateFilters]);

  const updatePage = useCallback((page: number) => {
    updateFilters({ ...filters, page });
  }, [filters, updateFilters]);

  const updatePageSize = useCallback((pageSize: number) => {
    updateFilters({ ...filters, page_size: pageSize, page: 1 });
  }, [filters, updateFilters]);

  const updateSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateFilters({ 
      ...filters, 
      sort_by: sortBy as 'created_utc' | 'score' | 'num_comments' | 'crawled_at',
      sort_order: sortOrder,
      page: 1 
    });
  }, [filters, updateFilters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    updatePage,
    updatePageSize,
    updateSort
  };
};