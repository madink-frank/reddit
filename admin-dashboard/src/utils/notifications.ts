// Simple notification utility
// This can be replaced with a more sophisticated toast library later

// Global type declarations
declare global {
  interface Window {
    notificationManager?: NotificationManagerInterface;
  }
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface NotificationOptions {
  duration?: number;
  position?: NotificationPosition;
  dismissible?: boolean;
  persistent?: boolean;
  onDismiss?: (notificationId: string) => void;
  onShow?: (notificationId: string) => void;
}

export interface NotificationConfig {
  message: string;
  type: NotificationType;
  options?: NotificationOptions;
}

/**
 * Utility type for creating strongly typed notification options
 */
export type CreateNotificationOptions<T extends NotificationType> = NotificationOptions & {
  type?: T;
};

export interface NotificationElement extends HTMLElement {
  notificationId?: string;
  notificationType?: NotificationType;
}

export interface NotificationManagerInterface {
  /**
   * Display a success notification
   * @param message - The message to display
   * @param options - Optional configuration for the notification
   * @returns The unique ID of the created notification
   */
  success(message: string, options?: NotificationOptions): string;
  
  /**
   * Display an error notification
   * @param message - The message to display
   * @param options - Optional configuration for the notification
   * @returns The unique ID of the created notification
   */
  error(message: string, options?: NotificationOptions): string;
  
  /**
   * Display an info notification
   * @param message - The message to display
   * @param options - Optional configuration for the notification
   * @returns The unique ID of the created notification
   */
  info(message: string, options?: NotificationOptions): string;
  
  /**
   * Display a warning notification
   * @param message - The message to display
   * @param options - Optional configuration for the notification
   * @returns The unique ID of the created notification
   */
  warning(message: string, options?: NotificationOptions): string;
  
  /**
   * Dismiss a specific notification by ID
   * @param notificationId - The ID of the notification to dismiss
   */
  dismiss(notificationId: string): void;
  
  /**
   * Dismiss all active notifications
   */
  dismissAll(): void;
  
  /**
   * Get all currently active notification elements
   * @returns Array of active notification elements
   */
  getActiveNotifications(): NotificationElement[];
  
  /**
   * Get the count of active notifications
   * @returns Number of active notifications
   */
  getNotificationCount(): number;
  
  /**
   * Get notifications filtered by type
   * @param type - The notification type to filter by
   * @returns Array of notification elements of the specified type
   */
  getNotificationsByType(type: NotificationType): NotificationElement[];
  
  /**
   * Check if a notification with the given ID is currently active
   * @param notificationId - The ID to check
   * @returns True if the notification is active, false otherwise
   */
  isNotificationActive(notificationId: string): boolean;
}

class NotificationManager implements NotificationManagerInterface {
  private container: HTMLElement | null = null;
  private notificationCounter: number = 0;
  private activeNotifications: Map<string, NotificationElement> = new Map();

  private createContainer(): HTMLElement {
    if (this.container) return this.container;

    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.container);
    return this.container;
  }

  private generateNotificationId(): string {
    return `notification-${++this.notificationCounter}-${Date.now()}`;
  }

  private createNotification(
    message: string,
    type: NotificationType,
    options: NotificationOptions = {}
  ): string {
    const container = this.createContainer();
    const notification = document.createElement('div') as NotificationElement;
    const notificationId = this.generateNotificationId();
    
    // Set notification properties
    notification.notificationId = notificationId;
    notification.notificationType = type;
    
    const baseClasses = 'px-4 py-3 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out';
    const typeClasses: Record<NotificationType, string> = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      info: 'bg-blue-500 text-white',
      warning: 'bg-yellow-500 text-black'
    };

    notification.className = `${baseClasses} ${typeClasses[type]} translate-x-full opacity-0`;
    
    const dismissible = options.dismissible !== false; // Default to true
    const dismissButton = dismissible ? `
      <button class="ml-3 text-white hover:text-gray-200 focus:outline-none" onclick="window.notificationManager?.dismiss('${notificationId}')">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    ` : '';

    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">${this.escapeHtml(message)}</span>
        ${dismissButton}
      </div>
    `;

    container.appendChild(notification);
    this.activeNotifications.set(notificationId, notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
      // Call onShow callback if provided
      if (options.onShow) {
        options.onShow(notificationId);
      }
    }, 10);

    // Auto remove (unless persistent)
    if (!options.persistent) {
      const duration = options.duration || (type === 'error' ? 5000 : 3000);
      setTimeout(() => {
        this.dismiss(notificationId);
      }, duration);
    }

    return notificationId;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  success(message: string, options?: NotificationOptions): string {
    return this.createNotification(message, 'success', options);
  }

  error(message: string, options?: NotificationOptions): string {
    return this.createNotification(message, 'error', options);
  }

  info(message: string, options?: NotificationOptions): string {
    return this.createNotification(message, 'info', options);
  }

  warning(message: string, options?: NotificationOptions): string {
    return this.createNotification(message, 'warning', options);
  }

  dismiss(notificationId: string): void {
    const notification = this.activeNotifications.get(notificationId);
    if (notification) {
      notification.classList.add('translate-x-full', 'opacity-0');
      
      // Find the original options to call onDismiss callback
      // Note: In a more sophisticated implementation, we'd store the options with the notification
      
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
        this.activeNotifications.delete(notificationId);
      }, 300);
    }
  }

  dismissAll(): void {
    this.activeNotifications.forEach((_, id) => {
      this.dismiss(id);
    });
  }

  getActiveNotifications(): NotificationElement[] {
    return Array.from(this.activeNotifications.values());
  }

  getNotificationCount(): number {
    return this.activeNotifications.size;
  }

  getNotificationsByType(type: NotificationType): NotificationElement[] {
    return Array.from(this.activeNotifications.values()).filter(
      notification => notification.notificationType === type
    );
  }

  isNotificationActive(notificationId: string): boolean {
    return this.activeNotifications.has(notificationId);
  }
}

export const toast = new NotificationManager();

// Make the notification manager globally available for inline event handlers
if (typeof window !== 'undefined') {
  window.notificationManager = toast;
}

// Export the class for advanced usage
export { NotificationManager };

// Export default instance for convenience
export default toast;

/**
 * Utility function for creating typed notifications
 * @param config - The notification configuration
 * @returns The notification ID
 */
export const createNotification = (config: NotificationConfig): string => {
  const { message, type, options } = config;
  return toast[type](message, options);
};