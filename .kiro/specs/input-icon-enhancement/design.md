# Design Document

## Overview

This design enhances the existing Input component to support left and right icons while maintaining full backward compatibility. The solution uses a container-based approach with absolute positioning for icons and appropriate padding adjustments for the input field.

## Architecture

### Component Structure
```
InputContainer
├── Label (existing)
├── InputWrapper (new container)
│   ├── LeftIcon (conditional)
│   ├── Input (existing, with padding adjustments)
│   ├── RightIcon (conditional)
│   └── StateIndicator (existing success/error icons)
├── HelpText (existing)
└── ErrorMessage (existing)
```

### Icon Positioning Strategy
- **Left Icon**: Positioned absolutely at left edge with appropriate padding
- **Right Icon**: Positioned absolutely at right edge, with state indicators taking precedence
- **State Indicators**: Maintain current behavior, positioned rightmost when present
- **Input Padding**: Dynamically adjusted based on icon presence

## Components and Interfaces

### Enhanced InputProps Interface
```typescript
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  // Existing props (unchanged)
  error?: string;
  label?: string;
  helpText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  success?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  
  // New icon props
  leftIcon?: React.ComponentType<any> | React.ReactElement;
  rightIcon?: React.ComponentType<any> | React.ReactElement;
  leftIconClassName?: string;
  rightIconClassName?: string;
}
```

### Icon Rendering Logic
```typescript
const renderIcon = (
  icon: React.ComponentType<any> | React.ReactElement | undefined,
  position: 'left' | 'right',
  className?: string
) => {
  if (!icon) return null;
  
  const baseClasses = cn(
    'absolute inset-y-0 flex items-center pointer-events-none',
    position === 'left' ? 'left-3' : 'right-3',
    'text-tertiary', // Default color
    className
  );
  
  return (
    <div className={baseClasses} aria-hidden="true">
      {React.isValidElement(icon) ? icon : React.createElement(icon, { 
        size: getIconSize(size),
        className: 'flex-shrink-0'
      })}
    </div>
  );
};
```

### Padding Calculation
```typescript
const getPaddingClasses = (
  leftIcon: boolean, 
  rightIcon: boolean, 
  hasStateIndicator: boolean,
  size: 'sm' | 'md' | 'lg'
) => {
  const basePadding = {
    sm: { left: 'pl-2.5', right: 'pr-2.5' },
    md: { left: 'pl-3', right: 'pr-3' },
    lg: { left: 'pl-4', right: 'pr-4' }
  };
  
  const iconPadding = {
    sm: { left: 'pl-8', right: 'pr-8' },
    md: { left: 'pl-10', right: 'pr-10' },
    lg: { left: 'pl-12', right: 'pr-12' }
  };
  
  const leftPadding = leftIcon ? iconPadding[size].left : basePadding[size].left;
  const rightPadding = (rightIcon || hasStateIndicator) ? iconPadding[size].right : basePadding[size].right;
  
  return `${leftPadding} ${rightPadding}`;
};
```

## Data Models

### Icon Size Mapping
```typescript
const getIconSize = (inputSize: 'sm' | 'md' | 'lg'): number => {
  const sizeMap = {
    sm: 14,
    md: 16,
    lg: 18
  };
  return sizeMap[inputSize];
};
```

### Icon Position Configuration
```typescript
const iconPositions = {
  left: {
    sm: 'left-2.5',
    md: 'left-3',
    lg: 'left-4'
  },
  right: {
    sm: 'right-2.5',
    md: 'right-3', 
    lg: 'right-4'
  }
} as const;
```

## Error Handling

### Icon Validation
- **Invalid Icon Type**: Gracefully handle non-renderable icon props by showing console warning in development
- **Icon Rendering Errors**: Wrap icon rendering in error boundaries to prevent component crashes
- **Missing Icon Dependencies**: Provide fallback behavior when icon components are undefined

### State Conflict Resolution
- **Right Icon + State Indicator**: State indicators (success/error) take precedence over custom right icons
- **Icon Overlap**: Ensure proper spacing calculations prevent icon overlap in all size variants
- **Focus Management**: Maintain proper focus behavior when icons are present

## Testing Strategy

### Unit Tests
1. **Icon Rendering**: Test that left and right icons render correctly
2. **Padding Calculation**: Verify input padding adjusts properly with icons
3. **State Precedence**: Confirm state indicators override right icons
4. **Accessibility**: Test ARIA attributes and screen reader compatibility
5. **Backward Compatibility**: Ensure existing Input usage remains unchanged

### Integration Tests
1. **Form Integration**: Test icon inputs within form contexts
2. **Theme Compatibility**: Verify icons work with different themes
3. **Responsive Behavior**: Test icon positioning across breakpoints

### Visual Regression Tests
1. **Icon Positioning**: Screenshot tests for all size/variant combinations
2. **State Combinations**: Visual tests for icons with success/error states
3. **Focus States**: Test focus ring appearance with icons

### Accessibility Tests
1. **Screen Reader**: Test with screen readers to ensure icons don't interfere
2. **Keyboard Navigation**: Verify tab order and focus management
3. **Color Contrast**: Ensure icon colors meet accessibility standards

## Implementation Notes

### Performance Considerations
- Icons are rendered conditionally to avoid unnecessary DOM elements
- Icon size calculations are memoized to prevent recalculation on re-renders
- CSS classes are computed once and cached

### Browser Compatibility
- Uses standard CSS positioning and flexbox for broad compatibility
- Icon rendering supports both component and element types
- Fallback behavior for unsupported icon formats

### Design System Integration
- Icons inherit colors from design system tokens
- Spacing follows existing design system scale
- Component maintains existing design patterns and conventions