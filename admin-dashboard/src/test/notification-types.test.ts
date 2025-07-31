// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { 
  toast, 
  NotificationManager, 
  NotificationManagerInterface,
  NotificationType,
  NotificationOptions,
  createNotification
} from '../utils/notifications';
import { useToast, UseToastReturn } from '../hooks/use-toast';

describe('Notification System Type Safety', () => {
  beforeEach(() => {
    // Clear any existing notifications
    toast.dismissAll();
  });

  afterEach(() => {
    // Clean up after each test
    toast.dismissAll();
  });

  it('should have proper type definitions for NotificationManager', () => {
    expect(toast).toBeInstanceOf(NotificationManager);
    expect(typeof toast.success).toBe('function');
    expect(typeof toast.error).toBe('function');
    expect(typeof toast.info).toBe('function');
    expect(typeof toast.warning).toBe('function');
    expect(typeof toast.dismiss).toBe('function');
    expect(typeof toast.dismissAll).toBe('function');
    expect(typeof toast.getActiveNotifications).toBe('function');
    expect(typeof toast.getNotificationCount).toBe('function');
    expect(typeof toast.getNotificationsByType).toBe('function');
    expect(typeof toast.isNotificationActive).toBe('function');
  });

  it('should return string IDs from notification methods', () => {
    const successId = toast.success('Test success');
    const errorId = toast.error('Test error');
    const infoId = toast.info('Test info');
    const warningId = toast.warning('Test warning');

    expect(typeof successId).toBe('string');
    expect(typeof errorId).toBe('string');
    expect(typeof infoId).toBe('string');
    expect(typeof warningId).toBe('string');
  });

  it('should accept proper notification options', () => {
    const options: NotificationOptions = {
      duration: 3000,
      position: 'top-right',
      dismissible: true,
      persistent: false,
      onShow: (id) => console.log('Shown:', id),
      onDismiss: (id) => console.log('Dismissed:', id)
    };

    const id = toast.success('Test with options', options);
    expect(typeof id).toBe('string');
  });

  it('should work with createNotification utility', () => {
    const id = createNotification({
      message: 'Test message',
      type: 'info',
      options: { duration: 2000 }
    });

    expect(typeof id).toBe('string');
    expect(toast.isNotificationActive(id)).toBe(true);
  });

  it('should provide proper type checking for notification types', () => {
    const validTypes: NotificationType[] = ['success', 'error', 'info', 'warning'];
    
    validTypes.forEach(type => {
      const id = toast[type]('Test message');
      expect(typeof id).toBe('string');
    });
  });
});