import { useEffect, useRef, useCallback } from 'react';
import { keyboardNavigationManager, type KeyboardShortcut } from '../utils/keyboardNavigation';

interface UseKeyboardNavigationOptions {
  enabled?: boolean;
  shortcuts?: KeyboardShortcut[];
  trapFocus?: boolean;
  autoFocus?: boolean;
}

/**
 * Hook for managing keyboard navigation in React components
 */
export const useKeyboardNavigation = (options: UseKeyboardNavigationOptions = {}) => {
  const {
    enabled = true,
    shortcuts = [],
    trapFocus = false,
    autoFocus = false
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const shortcutRefs = useRef<string[]>([]);

  // Register shortcuts
  useEffect(() => {
    if (!enabled) return;

    shortcuts.forEach(shortcut => {
      const key = `${shortcut.ctrlKey ? 'Ctrl+' : ''}${shortcut.shiftKey ? 'Shift+' : ''}${shortcut.altKey ? 'Alt+' : ''}${shortcut.metaKey ? 'Meta+' : ''}${shortcut.key}`;
      keyboardNavigationManager.registerShortcut(shortcut);
      shortcutRefs.current.push(key);
    });

    return () => {
      shortcutRefs.current.forEach(key => {
        keyboardNavigationManager.unregisterShortcut(key);
      });
      shortcutRefs.current = [];
    };
  }, [enabled, shortcuts]);

  // Handle focus trapping
  useEffect(() => {
    if (!enabled || !trapFocus || !containerRef.current) return;

    const cleanup = keyboardNavigationManager.trapFocus(containerRef.current);
    return cleanup;
  }, [enabled, trapFocus]);

  // Handle auto focus
  useEffect(() => {
    if (!enabled || !autoFocus || !containerRef.current) return;

    const firstFocusable = containerRef.current.querySelector(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;

    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, [enabled, autoFocus]);

  // Navigation functions
  const focusNext = useCallback(() => {
    if (!enabled) return;
    keyboardNavigationManager.focusNext();
  }, [enabled]);

  const focusPrevious = useCallback(() => {
    if (!enabled) return;
    keyboardNavigationManager.focusPrevious();
  }, [enabled]);

  const focusFirst = useCallback(() => {
    if (!enabled) return;
    keyboardNavigationManager.focusFirst();
  }, [enabled]);

  const focusLast = useCallback(() => {
    if (!enabled) return;
    keyboardNavigationManager.focusLast();
  }, [enabled]);

  return {
    containerRef,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    enabled
  };
};

/**
 * Hook for managing keyboard shortcuts in a component
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled = true) => {
  const shortcutRefs = useRef<string[]>([]);

  useEffect(() => {
    if (!enabled) return;

    shortcuts.forEach(shortcut => {
      const key = `${shortcut.ctrlKey ? 'Ctrl+' : ''}${shortcut.shiftKey ? 'Shift+' : ''}${shortcut.altKey ? 'Alt+' : ''}${shortcut.metaKey ? 'Meta+' : ''}${shortcut.key}`;
      keyboardNavigationManager.registerShortcut(shortcut);
      shortcutRefs.current.push(key);
    });

    return () => {
      shortcutRefs.current.forEach(key => {
        keyboardNavigationManager.unregisterShortcut(key);
      });
      shortcutRefs.current = [];
    };
  }, [shortcuts, enabled]);

  return {
    shortcuts: keyboardNavigationManager.getShortcuts()
  };
};

/**
 * Hook for managing focus trapping within a container
 */
export const useFocusTrap = (enabled = true) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const cleanup = keyboardNavigationManager.trapFocus(containerRef.current);
    return cleanup;
  }, [enabled]);

  return containerRef;
};

/**
 * Hook for managing roving tabindex (for lists, grids, etc.)
 */
export const useRovingTabindex = (enabled = true) => {
  const containerRef = useRef<HTMLElement>(null);
  const currentIndexRef = useRef(0);

  const updateTabindices = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      '[role="option"], [role="menuitem"], [role="tab"], [role="gridcell"], [data-roving-tabindex]'
    ) as NodeListOf<HTMLElement>;

    focusableElements.forEach((element, index) => {
      element.setAttribute('tabindex', index === currentIndexRef.current ? '0' : '-1');
    });
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      '[role="option"], [role="menuitem"], [role="tab"], [role="gridcell"], [data-roving-tabindex]'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    let newIndex = currentIndexRef.current;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (currentIndexRef.current + 1) % focusableElements.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndexRef.current === 0 
          ? focusableElements.length - 1 
          : currentIndexRef.current - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = focusableElements.length - 1;
        break;
      default:
        return;
    }

    currentIndexRef.current = newIndex;
    updateTabindices();
    focusableElements[newIndex].focus();
  }, [enabled, updateTabindices]);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);
    updateTabindices();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown, updateTabindices]);

  const setCurrentIndex = useCallback((index: number) => {
    currentIndexRef.current = index;
    updateTabindices();
  }, [updateTabindices]);

  return {
    containerRef,
    currentIndex: currentIndexRef.current,
    setCurrentIndex
  };
};

/**
 * Hook for managing accessible announcements
 */
export const useAnnouncements = () => {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create live region for announcements
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcer);
    announcerRef.current = announcer;

    return () => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current) return;

    announcerRef.current.setAttribute('aria-live', priority);
    announcerRef.current.textContent = message;

    // Clear the message after a short delay to allow for re-announcements
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  return { announce };
};

export default useKeyboardNavigation;