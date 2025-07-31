import React from 'react';
import { useAuthStore } from './auth';
import { useUIStore } from './ui';
import { useFiltersStore } from './filters';

// Development tools and debugging utilities
export interface StoreDebugInfo {
  name: string;
  state: unknown;
  actions: string[];
  subscribers: number;
}

class StoreDevTools {
  private stores: Map<string, any> = new Map();
  private logEnabled = import.meta.env.DEV;
  private logHistory: Array<{
    timestamp: string;
    store: string;
    action: string;
    prevState: unknown;
    nextState: unknown;
  }> = [];

  constructor() {
    if (this.logEnabled) {
      this.setupStoreLogging();
      this.exposeToWindow();
    }
  }

  private setupStoreLogging() {
    // Register stores for debugging
    this.registerStore('auth', useAuthStore);
    this.registerStore('ui', useUIStore);
    this.registerStore('filters', useFiltersStore);
  }

  private registerStore(name: string, store: any) {
    this.stores.set(name, store);

    // Subscribe to state changes for logging
    if (store.subscribe) {
      store.subscribe((state: unknown, prevState: unknown) => {
        if (this.logEnabled) {
          this.logStateChange(name, 'state_change', prevState, state);
        }
      });
    }
  }

  private logStateChange(
    storeName: string,
    action: string,
    prevState: unknown,
    nextState: unknown
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      store: storeName,
      action,
      prevState,
      nextState,
    };

    this.logHistory.push(logEntry);

    // Keep only last 100 entries
    if (this.logHistory.length > 100) {
      this.logHistory.shift();
    }

    // Console logging with colors
    console.group(`🏪 Store Update: ${storeName}`);
    console.log(`⏰ ${logEntry.timestamp}`);
    console.log(`🎬 Action: ${action}`);
    console.log('📦 Previous State:', prevState);
    console.log('📦 Next State:', nextState);
    console.groupEnd();
  }

  // Public methods for debugging
  public getStoreInfo(): StoreDebugInfo[] {
    return Array.from(this.stores.entries()).map(([name, store]) => ({
      name,
      state: store.getState(),
      actions: this.getStoreActions(store),
      subscribers: this.getSubscriberCount(store),
    }));
  }

  private getStoreActions(store: any): string[] {
    const state = store.getState();
    return Object.keys(state).filter(key => typeof state[key] === 'function');
  }

  private getSubscriberCount(store: any): number {
    // This is a rough estimate - Zustand doesn't expose subscriber count directly
    return store.listeners?.size || 0;
  }

  public getLogHistory() {
    return [...this.logHistory];
  }

  public clearLogHistory() {
    this.logHistory = [];
    console.log('🧹 Store log history cleared');
  }

  public exportState() {
    const stateSnapshot: Record<string, unknown> = {};
    this.stores.forEach((store, name) => {
      stateSnapshot[name] = store.getState();
    });

    const exportData = {
      timestamp: new Date().toISOString(),
      stores: stateSnapshot,
      logHistory: this.logHistory,
    };

    return JSON.stringify(exportData, null, 2);
  }

  public importState(data: string) {
    try {
      const imported = JSON.parse(data);

      if (imported.stores) {
        Object.entries(imported.stores).forEach(([storeName, state]) => {
          const store = this.stores.get(storeName);
          if (store && store.setState) {
            store.setState(state);
            console.log(`📥 Imported state for ${storeName}`);
          }
        });
      }

      if (imported.logHistory) {
        this.logHistory = imported.logHistory;
        console.log('📥 Imported log history');
      }
    } catch (error) {
      console.error('❌ Failed to import state:', error);
      throw error;
    }
  }

  public resetAllStores() {
    this.stores.forEach((store, name) => {
      if (store.persist?.clearStorage) {
        store.persist.clearStorage();
      }
      console.log(`🔄 Reset store: ${name}`);
    });

    // Reload page to reinitialize stores
    window.location.reload();
  }

  private exposeToWindow() {
    // Expose debugging tools to window object for console access
    (window as any).__STORE_DEVTOOLS__ = {
      getStoreInfo: () => this.getStoreInfo(),
      getLogHistory: () => this.getLogHistory(),
      clearLogHistory: () => this.clearLogHistory(),
      exportState: () => this.exportState(),
      importState: (data: string) => this.importState(data),
      resetAllStores: () => this.resetAllStores(),

      // Direct store access
      stores: {
        auth: useAuthStore,
        ui: useUIStore,
        filters: useFiltersStore,
      },

      // Utility functions
      logState: (storeName: string) => {
        const store = this.stores.get(storeName);
        if (store) {
          console.log(`📦 ${storeName} state:`, store.getState());
        } else {
          console.warn(`❌ Store '${storeName}' not found`);
        }
      },

      logAllStates: () => {
        this.stores.forEach((store, name) => {
          console.log(`📦 ${name}:`, store.getState());
        });
      },
    };

    console.log('🛠️ Store DevTools available at window.__STORE_DEVTOOLS__');
    console.log('💡 Try: __STORE_DEVTOOLS__.getStoreInfo()');
  }
}

// Initialize dev tools
export const storeDevTools = new StoreDevTools();

// React hook for accessing dev tools in components
export const useStoreDevTools = () => {
  if (!import.meta.env.DEV) {
    return null;
  }

  return {
    getStoreInfo: () => storeDevTools.getStoreInfo(),
    getLogHistory: () => storeDevTools.getLogHistory(),
    clearLogHistory: () => storeDevTools.clearLogHistory(),
    exportState: () => storeDevTools.exportState(),
    importState: (data: string) => storeDevTools.importState(data),
    resetAllStores: () => storeDevTools.resetAllStores(),
  };
};

// Performance monitoring hook
export const useStorePerformance = () => {
  const [renderCount, setRenderCount] = React.useState(0);
  const [lastRenderTime, setLastRenderTime] = React.useState(Date.now());

  React.useEffect(() => {
    setRenderCount(prev => prev + 1);
    setLastRenderTime(Date.now());
  });

  return {
    renderCount,
    lastRenderTime,
    timeSinceLastRender: Date.now() - lastRenderTime,
  };
};

// Store state persistence utilities
export const storePersistence = {
  // Backup current state to localStorage with timestamp
  backup: () => {
    const backup = storeDevTools.exportState();
    const key = `store-backup-${Date.now()}`;
    localStorage.setItem(key, backup);
    console.log(`💾 State backed up to ${key}`);
    return key;
  },

  // List all available backups
  listBackups: () => {
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('store-backup-')) {
        const timestamp = key.replace('store-backup-', '');
        backups.push({
          key,
          timestamp: new Date(parseInt(timestamp)).toISOString(),
        });
      }
    }
    return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  // Restore from backup
  restore: (backupKey: string) => {
    const backup = localStorage.getItem(backupKey);
    if (backup) {
      storeDevTools.importState(backup);
      console.log(`📥 State restored from ${backupKey}`);
    } else {
      console.error(`❌ Backup ${backupKey} not found`);
    }
  },

  // Clean old backups (keep only last 10)
  cleanup: () => {
    const backups = storePersistence.listBackups();
    if (backups.length > 10) {
      const toDelete = backups.slice(10);
      toDelete.forEach(backup => {
        localStorage.removeItem(backup.key);
        console.log(`🗑️ Deleted old backup: ${backup.key}`);
      });
    }
  },
};