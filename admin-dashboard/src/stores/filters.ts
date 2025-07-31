import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface DateRange {
  from?: string;
  to?: string;
}

export interface FilterState {
  search: string;
  dateRange: DateRange;
  status: string[];
  tags: string[];
  categories: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
  isDefault?: boolean;
}

interface FiltersState {
  // Current filters for each page
  pageFilters: Record<string, FilterState>;
  
  // Saved filter presets
  savedFilters: Record<string, SavedFilter[]>; // page -> filters
  
  // Quick filters (commonly used combinations)
  quickFilters: Record<string, Array<{ label: string; filters: Partial<FilterState> }>>;
  
  // Actions
  setPageFilters: (page: string, filters: Partial<FilterState>) => void;
  resetPageFilters: (page: string) => void;
  getPageFilters: (page: string) => FilterState;
  
  // Saved filters actions
  saveFilter: (page: string, name: string, filters: FilterState, isDefault?: boolean) => void;
  loadFilter: (page: string, filterId: string) => void;
  deleteFilter: (page: string, filterId: string) => void;
  getSavedFilters: (page: string) => SavedFilter[];
  
  // Quick filters actions
  setQuickFilters: (page: string, quickFilters: Array<{ label: string; filters: Partial<FilterState> }>) => void;
  applyQuickFilter: (page: string, quickFilter: Partial<FilterState>) => void;
  
  // Utility actions
  clearAllFilters: () => void;
  exportFilters: () => string;
  importFilters: (data: string) => void;
}

// Default filter state
const defaultFilterState: FilterState = {
  search: '',
  dateRange: {},
  status: [],
  tags: [],
  categories: [],
  sortBy: 'created_at',
  sortOrder: 'desc',
  page: 1,
  pageSize: 20,
};

export const useFiltersStore = create<FiltersState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        pageFilters: {},
        savedFilters: {},
        quickFilters: {
          // Default quick filters for common pages
          keywords: [
            { label: 'Active Keywords', filters: { status: ['active'] } },
            { label: 'Recent', filters: { sortBy: 'created_at', sortOrder: 'desc' } },
            { label: 'Most Posts', filters: { sortBy: 'post_count', sortOrder: 'desc' } },
          ],
          posts: [
            { label: 'Today', filters: { dateRange: { from: new Date().toISOString().split('T')[0] } } },
            { label: 'High Score', filters: { sortBy: 'score', sortOrder: 'desc' } },
            { label: 'Most Comments', filters: { sortBy: 'num_comments', sortOrder: 'desc' } },
          ],
          content: [
            { label: 'Blog Posts', filters: { categories: ['blog'] } },
            { label: 'Recent', filters: { sortBy: 'created_at', sortOrder: 'desc' } },
            { label: 'Product Intros', filters: { categories: ['product_intro'] } },
          ],
        },

        setPageFilters: (page: string, filters: Partial<FilterState>) => {
          set((state) => {
            if (!state.pageFilters[page]) {
              state.pageFilters[page] = { ...defaultFilterState };
            }
            Object.assign(state.pageFilters[page], filters);
          });
        },

        resetPageFilters: (page: string) => {
          set((state) => {
            state.pageFilters[page] = { ...defaultFilterState };
          });
        },

        getPageFilters: (page: string) => {
          return get().pageFilters[page] || { ...defaultFilterState };
        },

        saveFilter: (page: string, name: string, filters: FilterState, isDefault = false) => {
          const id = `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const savedFilter: SavedFilter = {
            id,
            name,
            filters: { ...filters },
            createdAt: new Date().toISOString(),
            isDefault,
          };

          set((state) => {
            if (!state.savedFilters[page]) {
              state.savedFilters[page] = [];
            }
            
            // If this is set as default, remove default from others
            if (isDefault) {
              state.savedFilters[page].forEach((filter) => {
                filter.isDefault = false;
              });
            }
            
            state.savedFilters[page].push(savedFilter);
          });
        },

        loadFilter: (page: string, filterId: string) => {
          const savedFilters = get().savedFilters[page] || [];
          const filter = savedFilters.find((f) => f.id === filterId);
          
          if (filter) {
            get().setPageFilters(page, filter.filters);
          }
        },

        deleteFilter: (page: string, filterId: string) => {
          set((state) => {
            if (state.savedFilters[page]) {
              state.savedFilters[page] = state.savedFilters[page].filter(
                (filter) => filter.id !== filterId
              );
            }
          });
        },

        getSavedFilters: (page: string) => {
          return get().savedFilters[page] || [];
        },

        setQuickFilters: (page: string, quickFilters: Array<{ label: string; filters: Partial<FilterState> }>) => {
          set((state) => {
            state.quickFilters[page] = quickFilters;
          });
        },

        applyQuickFilter: (page: string, quickFilter: Partial<FilterState>) => {
          get().setPageFilters(page, quickFilter);
        },

        clearAllFilters: () => {
          set((state) => {
            state.pageFilters = {};
            state.savedFilters = {};
          });
        },

        exportFilters: () => {
          const state = get();
          return JSON.stringify({
            pageFilters: state.pageFilters,
            savedFilters: state.savedFilters,
            quickFilters: state.quickFilters,
            exportedAt: new Date().toISOString(),
          });
        },

        importFilters: (data: string) => {
          try {
            const imported = JSON.parse(data);
            set((state) => {
              if (imported.pageFilters) {
                Object.assign(state.pageFilters, imported.pageFilters);
              }
              if (imported.savedFilters) {
                Object.assign(state.savedFilters, imported.savedFilters);
              }
              if (imported.quickFilters) {
                Object.assign(state.quickFilters, imported.quickFilters);
              }
            });
          } catch (error) {
            console.error('Failed to import filters:', error);
            throw new Error('Invalid filter data format');
          }
        },
      })),
      {
        name: 'filters-storage',
        partialize: (state) => ({
          savedFilters: state.savedFilters,
          quickFilters: state.quickFilters,
        }),
      }
    )
  )
);

// Utility hooks for specific pages
export const useKeywordFilters = () => {
  const filters = useFiltersStore((state) => state.getPageFilters('keywords'));
  const setFilters = (newFilters: Partial<FilterState>) => 
    useFiltersStore.getState().setPageFilters('keywords', newFilters);
  const resetFilters = () => useFiltersStore.getState().resetPageFilters('keywords');
  const savedFilters = useFiltersStore((state) => state.getSavedFilters('keywords'));
  const quickFilters = useFiltersStore((state) => state.quickFilters.keywords || []);

  return {
    filters,
    setFilters,
    resetFilters,
    savedFilters,
    quickFilters,
    saveFilter: (name: string, isDefault?: boolean) => 
      useFiltersStore.getState().saveFilter('keywords', name, filters, isDefault),
    loadFilter: (filterId: string) => 
      useFiltersStore.getState().loadFilter('keywords', filterId),
    deleteFilter: (filterId: string) => 
      useFiltersStore.getState().deleteFilter('keywords', filterId),
    applyQuickFilter: (quickFilter: Partial<FilterState>) => 
      useFiltersStore.getState().applyQuickFilter('keywords', quickFilter),
  };
};

export const usePostFilters = () => {
  const filters = useFiltersStore((state) => state.getPageFilters('posts'));
  const setFilters = (newFilters: Partial<FilterState>) => 
    useFiltersStore.getState().setPageFilters('posts', newFilters);
  const resetFilters = () => useFiltersStore.getState().resetPageFilters('posts');
  const savedFilters = useFiltersStore((state) => state.getSavedFilters('posts'));
  const quickFilters = useFiltersStore((state) => state.quickFilters.posts || []);

  return {
    filters,
    setFilters,
    resetFilters,
    savedFilters,
    quickFilters,
    saveFilter: (name: string, isDefault?: boolean) => 
      useFiltersStore.getState().saveFilter('posts', name, filters, isDefault),
    loadFilter: (filterId: string) => 
      useFiltersStore.getState().loadFilter('posts', filterId),
    deleteFilter: (filterId: string) => 
      useFiltersStore.getState().deleteFilter('posts', filterId),
    applyQuickFilter: (quickFilter: Partial<FilterState>) => 
      useFiltersStore.getState().applyQuickFilter('posts', quickFilter),
  };
};

export const useContentFilters = () => {
  const filters = useFiltersStore((state) => state.getPageFilters('content'));
  const setFilters = (newFilters: Partial<FilterState>) => 
    useFiltersStore.getState().setPageFilters('content', newFilters);
  const resetFilters = () => useFiltersStore.getState().resetPageFilters('content');
  const savedFilters = useFiltersStore((state) => state.getSavedFilters('content'));
  const quickFilters = useFiltersStore((state) => state.quickFilters.content || []);

  return {
    filters,
    setFilters,
    resetFilters,
    savedFilters,
    quickFilters,
    saveFilter: (name: string, isDefault?: boolean) => 
      useFiltersStore.getState().saveFilter('content', name, filters, isDefault),
    loadFilter: (filterId: string) => 
      useFiltersStore.getState().loadFilter('content', filterId),
    deleteFilter: (filterId: string) => 
      useFiltersStore.getState().deleteFilter('content', filterId),
    applyQuickFilter: (quickFilter: Partial<FilterState>) => 
      useFiltersStore.getState().applyQuickFilter('content', quickFilter),
  };
};