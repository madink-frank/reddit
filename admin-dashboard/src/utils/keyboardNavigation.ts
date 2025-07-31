/**
 * Keyboard Navigation Utilities
 * Provides comprehensive keyboard navigation support for the admin dashboard
 */

export interface KeyboardShortcut {
  key: string;
  description: string;
  handler: () => void;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
  global?: boolean;
}

export interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  role?: string;
  ariaLabel?: string;
}

/**
 * Keyboard Navigation Manager
 * Handles global keyboard shortcuts and focus management
 */
export class KeyboardNavigationManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private focusableElements: FocusableElement[] = [];
  private currentFocusIndex = -1;
  private isEnabled = true;

  constructor() {
    this.bindGlobalEvents();
    this.setupDefaultShortcuts();
  }

  /**
   * Register a keyboard shortcut
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(key: string): void {
    this.shortcuts.delete(key);
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Enable/disable keyboard navigation
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Update focusable elements list
   */
  updateFocusableElements(): void {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
      '[role="tab"]:not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = document.querySelectorAll(focusableSelectors) as NodeListOf<HTMLElement>;
    
    this.focusableElements = Array.from(elements)
      .filter(el => this.isElementVisible(el))
      .map((el, _index) => ({
        element: el,
        tabIndex: parseInt(el.getAttribute('tabindex') || '0'),
        role: el.getAttribute('role') || undefined,
        ariaLabel: el.getAttribute('aria-label') || undefined
      }))
      .sort((a, b) => {
        // Sort by tabindex, then by DOM order
        if (a.tabIndex !== b.tabIndex) {
          return a.tabIndex - b.tabIndex;
        }
        return 0;
      });
  }

  /**
   * Focus next element in tab order
   */
  focusNext(): void {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    this.focusableElements[this.currentFocusIndex].element.focus();
  }

  /**
   * Focus previous element in tab order
   */
  focusPrevious(): void {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = this.currentFocusIndex <= 0 
      ? this.focusableElements.length - 1 
      : this.currentFocusIndex - 1;
    this.focusableElements[this.currentFocusIndex].element.focus();
  }

  /**
   * Focus first element
   */
  focusFirst(): void {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = 0;
    this.focusableElements[0].element.focus();
  }

  /**
   * Focus last element
   */
  focusLast(): void {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = this.focusableElements.length - 1;
    this.focusableElements[this.currentFocusIndex].element.focus();
  }

  /**
   * Trap focus within a container
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  private bindGlobalEvents(): void {
    document.addEventListener('keydown', this.handleGlobalKeyDown.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
  }

  private handleGlobalKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Skip if user is typing in an input field
    if (this.isInputElement(event.target as HTMLElement)) {
      return;
    }

    const shortcutKey = this.getShortcutKeyFromEvent(event);
    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.handler();
      return;
    }

    // Handle built-in navigation keys
    switch (event.key) {
      case 'Tab':
        // Let browser handle tab navigation
        break;
      case 'Home':
        if (event.ctrlKey) {
          event.preventDefault();
          this.focusFirst();
        }
        break;
      case 'End':
        if (event.ctrlKey) {
          event.preventDefault();
          this.focusLast();
        }
        break;
      case 'F6':
        event.preventDefault();
        this.focusNextLandmark();
        break;
    }
  }

  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    const index = this.focusableElements.findIndex(item => item.element === target);
    if (index !== -1) {
      this.currentFocusIndex = index;
    }
  }

  private setupDefaultShortcuts(): void {
    // Navigation shortcuts
    this.registerShortcut({
      key: 'Alt+1',
      description: 'Go to Dashboard',
      handler: () => window.location.href = '/admin/dashboard',
      altKey: true
    });

    this.registerShortcut({
      key: 'Alt+2',
      description: 'Go to Keywords',
      handler: () => window.location.href = '/admin/keywords',
      altKey: true
    });

    this.registerShortcut({
      key: 'Alt+3',
      description: 'Go to Posts',
      handler: () => window.location.href = '/admin/posts',
      altKey: true
    });

    this.registerShortcut({
      key: 'Alt+4',
      description: 'Go to Analytics',
      handler: () => window.location.href = '/admin/analytics',
      altKey: true
    });

    // Utility shortcuts
    this.registerShortcut({
      key: 'Alt+/',
      description: 'Show keyboard shortcuts',
      handler: () => this.showShortcutsModal(),
      altKey: true
    });

    this.registerShortcut({
      key: 'Escape',
      description: 'Close modal/dropdown',
      handler: () => this.closeActiveModal(),
      global: true
    });

    // Skip links
    this.registerShortcut({
      key: 'Alt+s',
      description: 'Skip to main content',
      handler: () => this.skipToMainContent(),
      altKey: true
    });

    this.registerShortcut({
      key: 'Alt+n',
      description: 'Skip to navigation',
      handler: () => this.skipToNavigation(),
      altKey: true
    });
  }

  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.metaKey) parts.push('Meta');
    parts.push(shortcut.key);
    return parts.join('+');
  }

  private getShortcutKeyFromEvent(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey) parts.push('Meta');
    parts.push(event.key);
    return parts.join('+');
  }

  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      element.offsetParent !== null
    );
  }

  private isInputElement(element: HTMLElement | null): boolean {
    if (!element || !element.tagName || typeof element.getAttribute !== 'function') {
      return false;
    }
    
    const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
    return inputTypes.includes(element.tagName) || 
           element.contentEditable === 'true' ||
           element.getAttribute('role') === 'textbox';
  }

  private focusNextLandmark(): void {
    const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="region"]');
    if (landmarks.length === 0) return;

    const currentIndex = Array.from(landmarks).findIndex(landmark => 
      landmark.contains(document.activeElement)
    );
    
    const nextIndex = (currentIndex + 1) % landmarks.length;
    const nextLandmark = landmarks[nextIndex] as HTMLElement;
    
    // Focus the landmark or its first focusable child
    const firstFocusable = nextLandmark.querySelector('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])') as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      nextLandmark.focus();
    }
  }

  private showShortcutsModal(): void {
    // Dispatch custom event to show shortcuts modal
    document.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'));
  }

  private closeActiveModal(): void {
    // Close any open modals, dropdowns, etc.
    const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]') as HTMLElement;
    if (activeModal) {
      const closeButton = activeModal.querySelector('[aria-label="Close"], [data-dismiss="modal"]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }

    // Close dropdowns
    const openDropdowns = document.querySelectorAll('[aria-expanded="true"]');
    openDropdowns.forEach(dropdown => {
      (dropdown as HTMLElement).click();
    });
  }

  private skipToMainContent(): void {
    const mainContent = document.querySelector('[role="main"], main, #main-content') as HTMLElement;
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private skipToNavigation(): void {
    const navigation = document.querySelector('[role="navigation"], nav, #navigation') as HTMLElement;
    if (navigation) {
      const firstLink = navigation.querySelector('a, button') as HTMLElement;
      if (firstLink) {
        firstLink.focus();
      } else {
        navigation.focus();
      }
      navigation.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

/**
 * Hook for using keyboard navigation in React components
 */
export const useKeyboardNavigation = () => {
  const manager = new KeyboardNavigationManager();
  
  return {
    registerShortcut: manager.registerShortcut.bind(manager),
    unregisterShortcut: manager.unregisterShortcut.bind(manager),
    getShortcuts: manager.getShortcuts.bind(manager),
    trapFocus: manager.trapFocus.bind(manager),
    focusNext: manager.focusNext.bind(manager),
    focusPrevious: manager.focusPrevious.bind(manager),
    focusFirst: manager.focusFirst.bind(manager),
    focusLast: manager.focusLast.bind(manager),
    setEnabled: manager.setEnabled.bind(manager)
  };
};

/**
 * Global keyboard navigation manager instance
 */
export const keyboardNavigationManager = new KeyboardNavigationManager();

/**
 * Utility functions for keyboard navigation
 */
export const KeyboardUtils = {
  /**
   * Check if an element is focusable
   */
  isFocusable(element: HTMLElement): boolean {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[contenteditable="true"]'
    ];

    return focusableSelectors.some(selector => element.matches(selector)) &&
           this.isVisible(element);
  },

  /**
   * Check if an element is visible
   */
  isVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      element.offsetParent !== null
    );
  },

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = container.querySelectorAll(focusableSelectors) as NodeListOf<HTMLElement>;
    return Array.from(elements).filter(el => this.isVisible(el));
  },

  /**
   * Set proper tabindex for elements
   */
  setTabIndex(element: HTMLElement, index: number): void {
    element.setAttribute('tabindex', index.toString());
  },

  /**
   * Remove tabindex from element
   */
  removeTabIndex(element: HTMLElement): void {
    element.removeAttribute('tabindex');
  },

  /**
   * Add skip link to page
   */
  addSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLElement {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1000;
      transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
    return skipLink;
  }
};

export default KeyboardNavigationManager;