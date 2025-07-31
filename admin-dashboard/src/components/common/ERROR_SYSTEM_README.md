# Improved Error Message System

This document describes the enhanced error handling system implemented for the Reddit Content Platform admin dashboard.

## Overview

The improved error message system provides:

- **User-friendly error messages** with clear, actionable language
- **Appropriate icons and colors** for different error types and severities
- **Retry buttons** for recoverable errors
- **Help links** to relevant documentation
- **Suggested actions** to help users resolve issues
- **Toast notifications** for quick feedback
- **Comprehensive error reporting** for debugging

## Components

### ErrorHandler

The main error display component that shows detailed error information with actions.

```tsx
import { ErrorHandler, useErrorHandler } from './components/common/ErrorHandler';

const MyComponent = () => {
  const { errors, addError, dismissError, retryError, reportError } = useErrorHandler();

  return (
    <ErrorHandler
      errors={errors}
      onDismiss={dismissError}
      onRetry={retryError}
      onReport={reportError}
      showStackTrace={false} // Set to true in development
    />
  );
};
```

### ErrorToast

Quick, non-intrusive notifications for immediate feedback.

```tsx
import { useToast } from './components/common/ErrorToast';

const MyComponent = () => {
  const { showError, showWarning, showInfo, showSuccess } = useToast();

  const handleError = () => {
    showError('Something went wrong!', {
      action: {
        label: 'Retry',
        onClick: () => showSuccess('Retry successful!')
      }
    });
  };

  return <button onClick={handleError}>Trigger Error</button>;
};
```

## Error Types and Styling

### Network Errors
- **Icon**: Wifi icon (blue)
- **Color**: Blue border and background
- **Retryable**: Yes
- **Suggested Actions**: Check connection, refresh page, wait and retry

### Validation Errors
- **Icon**: Alert circle (yellow)
- **Color**: Yellow border and background
- **Retryable**: No
- **Suggested Actions**: Review fields, check format, fill required fields

### Permission Errors
- **Icon**: Shield (orange)
- **Color**: Orange border and background
- **Retryable**: No
- **Suggested Actions**: Log in, contact admin, check permissions

### System Errors
- **Icon**: X circle for critical, Alert triangle for others (red/orange)
- **Color**: Red/orange border and background
- **Retryable**: Yes
- **Suggested Actions**: Try again, clear cache, contact support

### User Errors
- **Icon**: Info circle (blue)
- **Color**: Blue border and background
- **Retryable**: No
- **Suggested Actions**: Review input, check documentation, try different approach

## Error Severity Levels

### Low
- **Color**: Blue
- **Auto-dismiss**: Yes (after 10 seconds)
- **Use case**: Minor issues, informational messages

### Medium
- **Color**: Yellow
- **Auto-dismiss**: No
- **Use case**: Validation errors, warnings

### High
- **Color**: Orange
- **Auto-dismiss**: No
- **Use case**: Important errors that need attention

### Critical
- **Color**: Red
- **Auto-dismiss**: No
- **Use case**: System failures, security issues

## Helper Functions

### Error Creators

Pre-configured error creators for common scenarios:

```tsx
import { 
  createNetworkError, 
  createValidationError, 
  createPermissionError, 
  createSystemError, 
  createUserError 
} from './components/common/ErrorHandler';

// Network error
addError(createNetworkError('Failed to connect to server'));

// Validation error with field context
addError(createValidationError('Invalid email format', 'email'));

// Permission error with custom message
addError(createPermissionError('Admin access required'));

// System error with high severity
addError(createSystemError('Database connection failed', { severity: 'critical' }));

// User error with custom suggestions
addError(createUserError('File too large', {
  suggestedActions: ['Choose a smaller file', 'Compress the image', 'Contact support']
}));
```

### Custom Error Creation

For more control, use the `createErrorInfo` function:

```tsx
import { createErrorInfo } from './components/common/ErrorHandler';

const customError = createErrorInfo('network', 'high', 'Custom error message', {
  feature: 'Data Sync',
  action: 'Fetching user data',
  retryable: true,
  helpUrl: '/help/custom-issue',
  suggestedActions: ['Custom action 1', 'Custom action 2'],
  context: { endpoint: '/api/data', method: 'GET' }
});

addError(customError);
```

## Features

### User-Friendly Messages

The system automatically converts technical error messages into user-friendly language:

- Network timeouts → "The request took too long to complete"
- 500 errors → "Our servers are experiencing issues"
- Validation failures → "Please check your input and try again"

### Suggested Actions

Each error type includes contextual suggestions:

- **Network**: Check connection, refresh, wait
- **Validation**: Review fields, check format, fill required
- **Permission**: Log in, contact admin, check permissions
- **System**: Try again, clear cache, contact support
- **User**: Review input, check docs, try different approach

### Help Integration

Errors include help links that open relevant documentation:

- Network errors → `/help/connection-issues`
- Validation errors → `/help/form-validation`
- Permission errors → `/help/account-permissions`
- System errors → `/help/technical-issues`
- User errors → `/help/user-guide`

### Error Reporting

Users can report errors with one click. The system collects:

- Error details and context
- User agent and URL
- Timestamp and error ID
- Stack trace (if available)

### Accessibility

The error system is fully accessible:

- **Screen reader support**: Proper ARIA labels and semantic markup
- **Keyboard navigation**: All interactive elements are keyboard accessible
- **High contrast**: Colors work in high contrast mode
- **Reduced motion**: Respects user's motion preferences

## Best Practices

### When to Use Each Component

- **ErrorHandler**: For detailed error display with full context and actions
- **ErrorToast**: For quick feedback and non-critical notifications

### Error Message Guidelines

1. **Be specific**: "Email format is invalid" vs "Invalid input"
2. **Be actionable**: Include what the user should do next
3. **Be empathetic**: Use friendly, helpful language
4. **Be concise**: Keep messages short but informative

### Error Context

Always provide context when creating errors:

```tsx
addError(createNetworkError('Failed to save user profile', {
  feature: 'User Management',
  action: 'Save profile',
  context: { userId: '123', endpoint: '/api/users/123' }
}));
```

### Testing

The system includes comprehensive tests. Run them with:

```bash
npm test -- ErrorHandler.test.tsx --run
```

## Migration Guide

### From Old Error System

Replace old error handling:

```tsx
// Old way
setError('Something went wrong');

// New way
addError(createSystemError('Something went wrong', {
  feature: 'Current Feature',
  action: 'Current Action'
}));
```

### Adding to Existing Components

1. Import the hook: `import { useErrorHandler } from './components/common/ErrorHandler';`
2. Use the hook: `const { addError } = useErrorHandler();`
3. Create errors: `addError(createNetworkError('Connection failed'));`
4. Display errors: `<ErrorHandler errors={errors} ... />`

## Examples

See `ErrorSystemDemo.tsx` for a complete working example of all features.

## Support

For questions or issues with the error system, check:

1. This documentation
2. Component tests for usage examples
3. The demo component for interactive examples
4. Help links for user-facing documentation