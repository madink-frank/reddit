/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  /**
   * Trap focus within a container element
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.restoreFocus();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }

  /**
   * Save current focus to restore later
   */
  static saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }

  /**
   * Restore previously saved focus
   */
  static restoreFocus(): void {
    const elementToFocus = this.focusStack.pop();
    if (elementToFocus) {
      elementToFocus.focus();
    }
  }

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => this.isVisible(el as HTMLElement)) as HTMLElement[];
  }

  /**
   * Check if element is visible and focusable
   */
  private static isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }
}

// ARIA utilities
export class AriaManager {
  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * Set up proper ARIA relationships
   */
  static linkElements(trigger: HTMLElement, target: HTMLElement): void {
    const targetId = target.id || `aria-target-${Date.now()}`;
    target.id = targetId;
    trigger.setAttribute('aria-controls', targetId);
  }

  /**
   * Update ARIA expanded state
   */
  static setExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  /**
   * Set ARIA pressed state for toggle buttons
   */
  static setPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', pressed.toString());
  }

  /**
   * Set ARIA selected state
   */
  static setSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', selected.toString());
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation in a list
   */
  static handleArrowKeys(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (newIndex: number) => void
  ): void {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    onIndexChange(newIndex);
    items[newIndex]?.focus();
  }

  /**
   * Handle Enter and Space key activation
   */
  static handleActivation(
    event: KeyboardEvent,
    callback: () => void
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
}

// Color contrast utilities
export class ColorContrast {
  /**
   * Calculate color contrast ratio
   */
  static getContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if color combination meets WCAG AA standards
   */
  static meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Check if color combination meets WCAG AAA standards
   */
  static meetsWCAGAAA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  /**
   * Get relative luminance of a color
   */
  private static getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  /**
   * Create screen reader only text
   */
  static createSROnlyText(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  }

  /**
   * Add skip link for keyboard navigation
   */
  static addSkipLink(targetId: string, linkText = 'Skip to main content'): void {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = linkText;
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      border-radius: 4px;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Describe image for screen readers
   */
  static describeImage(img: HTMLImageElement, description: string): void {
    img.setAttribute('alt', description);
    img.setAttribute('role', 'img');
  }
}

// Reduced motion utilities
export class MotionPreferences {
  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Apply animation only if user doesn't prefer reduced motion
   */
  static conditionalAnimation(
    element: HTMLElement,
    animationClass: string,
    fallbackClass?: string
  ): void {
    if (this.prefersReducedMotion()) {
      if (fallbackClass) {
        element.classList.add(fallbackClass);
      }
    } else {
      element.classList.add(animationClass);
    }
  }

  /**
   * Set up media query listener for motion preferences
   */
  static onMotionPreferenceChange(callback: (prefersReduced: boolean) => void): () => void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }
}

// Form accessibility utilities
export class FormAccessibility {
  /**
   * Associate label with form control
   */
  static associateLabel(input: HTMLInputElement, label: HTMLLabelElement): void {
    const inputId = input.id || `input-${Date.now()}`;
    input.id = inputId;
    label.setAttribute('for', inputId);
  }

  /**
   * Add error message to form field
   */
  static addErrorMessage(input: HTMLInputElement, message: string): void {
    const errorId = `${input.id}-error`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'error-message';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'polite');
      input.parentNode?.insertBefore(errorElement, input.nextSibling);
    }
    
    errorElement.textContent = message;
    input.setAttribute('aria-describedby', errorId);
    input.setAttribute('aria-invalid', 'true');
  }

  /**
   * Remove error message from form field
   */
  static removeErrorMessage(input: HTMLInputElement): void {
    const errorId = `${input.id}-error`;
    const errorElement = document.getElementById(errorId);
    
    if (errorElement) {
      errorElement.remove();
    }
    
    input.removeAttribute('aria-describedby');
    input.removeAttribute('aria-invalid');
  }

  /**
   * Add help text to form field
   */
  static addHelpText(input: HTMLInputElement, helpText: string): void {
    const helpId = `${input.id}-help`;
    const helpElement = document.createElement('div');
    helpElement.id = helpId;
    helpElement.className = 'help-text';
    helpElement.textContent = helpText;
    
    input.parentNode?.insertBefore(helpElement, input.nextSibling);
    input.setAttribute('aria-describedby', helpId);
  }
}

// Accessibility testing utilities
export class AccessibilityTester {
  /**
   * Check for common accessibility issues
   */
  static runBasicChecks(): string[] {
    const issues: string[] = [];

    // Check for images without alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images missing alt text`);
    }

    // Check for form inputs without labels
    const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeledInputs = Array.from(inputsWithoutLabels).filter(input => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} form inputs without labels`);
    }

    // Check for buttons without accessible names
    const buttonsWithoutNames = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    const unnamedButtons = Array.from(buttonsWithoutNames).filter(button => 
      !button.textContent?.trim()
    );
    if (unnamedButtons.length > 0) {
      issues.push(`${unnamedButtons.length} buttons without accessible names`);
    }

    // Check for missing page title
    if (!document.title.trim()) {
      issues.push('Page missing title');
    }

    // Check for missing main landmark
    if (!document.querySelector('main, [role="main"]')) {
      issues.push('Page missing main landmark');
    }

    return issues;
  }

  /**
   * Log accessibility issues to console
   */
  static logIssues(): void {
    const issues = this.runBasicChecks();
    if (issues.length > 0) {
      console.warn('Accessibility issues found:', issues);
    } else {
      console.log('No basic accessibility issues found');
    }
  }
}

// All utilities are already exported individually above