/**
 * Error Handler Tests
 * 
 * Tests for the improved error message system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  ErrorHandler, 
  useErrorHandler, 
  createNetworkError, 
  createValidationError, 
  createPermissionError, 
  createSystemError, 
  createUserError 
} from '../ErrorHandler';

// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally

// Mock components for testing
vi.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

vi.mock('../../ui/Badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span {...props}>{children}</span>
  )
}));

vi.mock('../../ui/Modal', () => ({
  Modal: ({ children, isOpen, title, onClose }: any) => 
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null
}));

// Test component that uses the error handler
const TestComponent: React.FC = () => {
  const { errors, addError, dismissError, retryError, reportError } = useErrorHandler();

  const handleAddNetworkError = () => {
    addError(createNetworkError('Connection failed'));
  };

  const handleAddValidationError = () => {
    addError(createValidationError('Invalid email format', 'email'));
  };

  return (
    <div>
      <button onClick={handleAddNetworkError} data-testid="add-network-error">
        Add Network Error
      </button>
      <button onClick={handleAddValidationError} data-testid="add-validation-error">
        Add Validation Error
      </button>
      
      <ErrorHandler
        errors={errors}
        onDismiss={dismissError}
        onRetry={retryError}
        onReport={reportError}
      />
    </div>
  );
};

describe('ErrorHandler', () => {
  beforeEach(() => {
    // Clear any existing errors
    vi.clearAllMocks();
  });

  test('displays network error with appropriate styling and actions', async () => {
    render(<TestComponent />);
    
    // Add a network error
    fireEvent.click(screen.getByTestId('add-network-error'));
    
    // Check if error is displayed
    expect(screen.getByText('Connection Issue')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    
    // Check if retry button is present (network errors are retryable)
    expect(screen.getByText('Retry')).toBeInTheDocument();
    
    // Check if help button is present
    expect(screen.getByText('Help')).toBeInTheDocument();
    
    // Check if report button is present
    expect(screen.getByText('Report')).toBeInTheDocument();
  });

  test('displays validation error with appropriate styling', async () => {
    render(<TestComponent />);
    
    // Add a validation error
    fireEvent.click(screen.getByTestId('add-validation-error'));
    
    // Check if error is displayed
    expect(screen.getByText('Input Error')).toBeInTheDocument();
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    
    // Validation errors should not have retry button
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  test('can dismiss errors', async () => {
    render(<TestComponent />);
    
    // Add an error
    fireEvent.click(screen.getByTestId('add-network-error'));
    
    // Check if error is displayed
    expect(screen.getByText('Connection Issue')).toBeInTheDocument();
    
    // Dismiss the error
    const dismissButton = screen.getByTitle('Dismiss this error');
    fireEvent.click(dismissButton);
    
    // Check if error is removed
    await waitFor(() => {
      expect(screen.queryByText('Connection Issue')).not.toBeInTheDocument();
    });
  });

  test('shows suggested actions for errors', async () => {
    render(<TestComponent />);
    
    // Add a network error
    fireEvent.click(screen.getByTestId('add-network-error'));
    
    // Check if suggested actions are displayed
    expect(screen.getByText('Try these steps:')).toBeInTheDocument();
    expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
    expect(screen.getByText('Try refreshing the page')).toBeInTheDocument();
  });
});

describe('Error Creator Functions', () => {
  test('createNetworkError creates correct error structure', () => {
    const error = createNetworkError('Custom network message');
    
    expect(error.type).toBe('network');
    expect(error.severity).toBe('medium');
    expect(error.message).toBe('Custom network message');
    expect(error.retryable).toBe(true);
    expect(error.userFriendly).toBe(true);
    expect(error.suggestedActions).toContain('Check your internet connection');
  });

  test('createValidationError creates correct error structure', () => {
    const error = createValidationError('Invalid input', 'username');
    
    expect(error.type).toBe('validation');
    expect(error.severity).toBe('low');
    expect(error.message).toBe('Invalid input');
    expect(error.retryable).toBe(false);
    expect(error.details).toBe('Field: username');
    expect(error.suggestedActions).toContain('Review the highlighted fields');
  });

  test('createPermissionError creates correct error structure', () => {
    const error = createPermissionError();
    
    expect(error.type).toBe('permission');
    expect(error.severity).toBe('medium');
    expect(error.message).toBe('Access denied');
    expect(error.retryable).toBe(false);
    expect(error.suggestedActions).toContain('Log in to your account');
  });

  test('createSystemError creates correct error structure', () => {
    const error = createSystemError('Database error');
    
    expect(error.type).toBe('system');
    expect(error.severity).toBe('high');
    expect(error.message).toBe('Database error');
    expect(error.retryable).toBe(true);
    expect(error.suggestedActions).toContain('Try again in a few minutes');
  });

  test('createUserError creates correct error structure', () => {
    const error = createUserError('File too large');
    
    expect(error.type).toBe('user');
    expect(error.severity).toBe('low');
    expect(error.message).toBe('File too large');
    expect(error.retryable).toBe(false);
    expect(error.suggestedActions).toContain('Review your input');
  });
});

describe('useErrorHandler Hook', () => {
  test('adds and manages errors correctly', () => {
    const TestHookComponent = () => {
      const { errors, addError, dismissError } = useErrorHandler();
      
      return (
        <div>
          <div data-testid="error-count">{errors.length}</div>
          <button 
            onClick={() => addError(createNetworkError('Test error'))}
            data-testid="add-error"
          >
            Add Error
          </button>
          <button 
            onClick={() => errors.length > 0 && dismissError(errors[0].id)}
            data-testid="dismiss-error"
          >
            Dismiss Error
          </button>
        </div>
      );
    };

    render(<TestHookComponent />);
    
    // Initially no errors
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    
    // Add an error
    fireEvent.click(screen.getByTestId('add-error'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    
    // Dismiss the error
    fireEvent.click(screen.getByTestId('dismiss-error'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });
});