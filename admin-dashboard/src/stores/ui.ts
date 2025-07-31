import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Modal {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  onClose?: () => void;
}

export interface Sidebar {
  isCollapsed: boolean;
  activeSection?: string;
}

export interface Theme {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

interface UIState {
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Toast notifications
  toasts: Toast[];
  
  // Modal management
  modals: Modal[];
  
  // Sidebar state
  sidebar: Sidebar;
  
  // Theme settings
  theme: Theme;
  
  // Page-specific states
  pageStates: Record<string, Record<string, unknown>>;
  
  // Actions
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Modal actions
  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveSection: (section: string) => void;
  
  // Theme actions
  setTheme: (theme: Partial<Theme>) => void;
  toggleThemeMode: () => void;
  
  // Page state actions
  setPageState: (page: string, key: string, value: unknown) => void;
  getPageState: (page: string, key: string) => unknown;
  clearPageState: (page: string) => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        globalLoading: false,
        loadingStates: {},
        toasts: [],
        modals: [],
        sidebar: {
          isCollapsed: false,
          activeSection: 'dashboard',
        },
        theme: {
          mode: 'system',
          primaryColor: '#3b82f6',
          fontSize: 'medium',
        },
        pageStates: {},

        // Loading actions
        setGlobalLoading: (loading: boolean) => {
          set((state) => {
            state.globalLoading = loading;
          });
        },

        setLoading: (key: string, loading: boolean) => {
          set((state) => {
            if (loading) {
              state.loadingStates[key] = true;
            } else {
              delete state.loadingStates[key];
            }
          });
        },

        isLoading: (key: string) => {
          return get().loadingStates[key] || false;
        },

        // Toast actions
        addToast: (toast: Omit<Toast, 'id'>) => {
          const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newToast: Toast = {
            id,
            duration: 5000, // Default 5 seconds
            ...toast,
          };

          set((state) => {
            state.toasts.push(newToast);
          });

          // Auto-remove toast after duration
          if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, newToast.duration);
          }
        },

        removeToast: (id: string) => {
          set((state) => {
            state.toasts = state.toasts.filter((toast) => toast.id !== id);
          });
        },

        clearToasts: () => {
          set((state) => {
            state.toasts = [];
          });
        },

        // Modal actions
        openModal: (modal: Omit<Modal, 'id'>) => {
          const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newModal: Modal = { id, ...modal };

          set((state) => {
            state.modals.push(newModal);
          });
        },

        closeModal: (id: string) => {
          set((state) => {
            const modal = state.modals.find((m) => m.id === id);
            if (modal?.onClose) {
              modal.onClose();
            }
            state.modals = state.modals.filter((m) => m.id !== id);
          });
        },

        closeAllModals: () => {
          set((state) => {
            state.modals.forEach((modal) => {
              if (modal.onClose) {
                modal.onClose();
              }
            });
            state.modals = [];
          });
        },

        // Sidebar actions
        toggleSidebar: () => {
          set((state) => {
            state.sidebar.isCollapsed = !state.sidebar.isCollapsed;
          });
        },

        setSidebarCollapsed: (collapsed: boolean) => {
          set((state) => {
            state.sidebar.isCollapsed = collapsed;
          });
        },

        setActiveSection: (section: string) => {
          set((state) => {
            state.sidebar.activeSection = section;
          });
        },

        // Theme actions
        setTheme: (theme: Partial<Theme>) => {
          set((state) => {
            Object.assign(state.theme, theme);
          });
        },

        toggleThemeMode: () => {
          set((state) => {
            const modes: Theme['mode'][] = ['light', 'dark', 'system'];
            const currentIndex = modes.indexOf(state.theme.mode);
            const nextIndex = (currentIndex + 1) % modes.length;
            state.theme.mode = modes[nextIndex];
          });
        },

        // Page state actions
        setPageState: (page: string, key: string, value: unknown) => {
          set((state) => {
            if (!state.pageStates[page]) {
              state.pageStates[page] = {};
            }
            state.pageStates[page][key] = value;
          });
        },

        getPageState: (page: string, key: string) => {
          return get().pageStates[page]?.[key];
        },

        clearPageState: (page: string) => {
          set((state) => {
            delete state.pageStates[page];
          });
        },
      })),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          sidebar: state.sidebar,
          theme: state.theme,
          pageStates: state.pageStates,
        }),
      }
    )
  )
);

// Utility hooks for specific UI features
export const useToasts = () => {
  const toasts = useUIStore((state) => state.toasts);
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);
  const clearToasts = useUIStore((state) => state.clearToasts);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    // Convenience methods
    success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
  };
};

export const useModals = () => {
  const modals = useUIStore((state) => state.modals);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const closeAllModals = useUIStore((state) => state.closeAllModals);

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
  };
};

export const useLoading = () => {
  const globalLoading = useUIStore((state) => state.globalLoading);
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);
  const setLoading = useUIStore((state) => state.setLoading);
  const isLoading = useUIStore((state) => state.isLoading);

  return {
    globalLoading,
    setGlobalLoading,
    setLoading,
    isLoading,
  };
};

export const useSidebar = () => {
  const sidebar = useUIStore((state) => state.sidebar);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);
  const setActiveSection = useUIStore((state) => state.setActiveSection);

  return {
    ...sidebar,
    toggleSidebar,
    setSidebarCollapsed,
    setActiveSection,
  };
};

export const useTheme = () => {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const toggleThemeMode = useUIStore((state) => state.toggleThemeMode);

  return {
    ...theme,
    setTheme,
    toggleThemeMode,
  };
};