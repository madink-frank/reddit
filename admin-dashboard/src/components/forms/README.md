# Form Components

This directory contains unified form input components with consistent styling, accessibility features, and user experience improvements.

## Overview

The form components have been standardized to provide:

- **Consistent Visual Design**: All form inputs share the same visual language
- **Accessibility**: Full keyboard navigation, screen reader support, and ARIA attributes
- **Error Handling**: Unified error states with clear visual indicators
- **Multiple Variants**: Default, filled, and outlined styles
- **Responsive Design**: Works seamlessly across all device sizes
- **TypeScript Support**: Full type safety and IntelliSense

## Components

### Input Component

Enhanced text input with label, help text, error states, and success indicators.

```tsx
import { Input } from '../ui/Input';

// Basic usage
<Input
  label="Email Address"
  placeholder="your.email@example.com"
  type="email"
  required
/>

// With error state
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// With success state
<Input
  label="Username"
  value="john_doe"
  success={true}
  helpText="Username is available"
/>

// Different sizes
<Input label="Small" size="sm" />
<Input label="Medium" size="md" />
<Input label="Large" size="lg" />

// Different variants
<Input label="Default" variant="default" />
<Input label="Filled" variant="filled" />
<Input label="Outlined" variant="outlined" />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text displayed above the input |
| `helpText` | `string` | - | Help text displayed below the input |
| `error` | `string` | - | Error message (shows error state) |
| `success` | `boolean` | `false` | Shows success state with checkmark |
| `variant` | `'default' \| 'filled' \| 'outlined'` | `'default'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `required` | `boolean` | `false` | Shows required indicator (*) |

### Select Component

Enhanced select dropdown with consistent styling and accessibility.

```tsx
import { Select, SelectItem } from '../ui/Select';

// Basic usage
<Select
  label="Category"
  placeholder="Choose a category"
  value={category}
  onValueChange={setCategory}
>
  <SelectItem value="tech">Technology</SelectItem>
  <SelectItem value="design">Design</SelectItem>
  <SelectItem value="business">Business</SelectItem>
</Select>

// With error state
<Select
  label="Priority"
  error="Please select a priority level"
  required
>
  <SelectItem value="low">Low</SelectItem>
  <SelectItem value="medium">Medium</SelectItem>
  <SelectItem value="high">High</SelectItem>
</Select>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text displayed above the select |
| `placeholder` | `string` | - | Placeholder text when no option is selected |
| `helpText` | `string` | - | Help text displayed below the select |
| `error` | `string` | - | Error message (shows error state) |
| `success` | `boolean` | `false` | Shows success state with checkmark |
| `variant` | `'default' \| 'filled' \| 'outlined'` | `'default'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Select size |
| `onValueChange` | `(value: string) => void` | - | Callback when selection changes |

### Textarea Component

Enhanced textarea with resizing options and consistent styling.

```tsx
import { Textarea } from '../ui/textarea';

// Basic usage
<Textarea
  label="Message"
  placeholder="Enter your message..."
  rows={4}
  value={message}
  onChange={(e) => setMessage(e.target.value)}
/>

// With error state
<Textarea
  label="Description"
  error="Description must be at least 10 characters"
  helpText="Provide a detailed description"
  required
/>

// Different resize options
<Textarea label="No Resize" resize="none" />
<Textarea label="Vertical Resize" resize="vertical" />
<Textarea label="Both Directions" resize="both" />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text displayed above the textarea |
| `helpText` | `string` | - | Help text displayed below the textarea |
| `error` | `string` | - | Error message (shows error state) |
| `success` | `boolean` | `false` | Shows success state with checkmark |
| `variant` | `'default' \| 'filled' \| 'outlined'` | `'default'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Textarea size |
| `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Resize behavior |

## Design System Integration

### CSS Classes

The components use standardized CSS classes from the design system:

```css
/* Form Labels */
.form-label
.form-label-required

/* Help Text */
.form-help-text

/* Error Text */
.form-error-text

/* Input States */
.input-error
.input-success
.input-filled
.input-outlined

/* Sizes */
.input-sm, .select-sm, .textarea-sm
.input-lg, .select-lg, .textarea-lg
```

### Color Variables

```css
--color-border-primary: Default border color
--color-border-focus: Focus state border
--color-border-error: Error state border
--color-border-success: Success state border
--color-text-primary: Label text color
--color-text-tertiary: Help text color
--color-error: Error text color
```

## Accessibility Features

### Keyboard Navigation
- **Tab**: Navigate between form fields
- **Shift + Tab**: Navigate backwards
- **Enter**: Submit forms
- **Arrow Keys**: Navigate select options
- **Escape**: Close dropdowns

### Screen Reader Support
- Proper label associations using `htmlFor` and `id`
- ARIA attributes for error states
- Required field announcements
- Error message announcements
- State change notifications

### Visual Accessibility
- High contrast focus indicators
- Color-blind friendly error states
- Consistent visual hierarchy
- Scalable text and spacing

## Form Validation

### Built-in Validation States

```tsx
// Error state with message
<Input
  label="Email"
  error="Please enter a valid email address"
  value={email}
  onChange={handleEmailChange}
/>

// Success state
<Input
  label="Username"
  success={isUsernameValid}
  helpText="Username is available"
/>

// Required field indicator
<Input
  label="Full Name"
  required
  helpText="This field is required"
/>
```

### Custom Validation

```tsx
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

const validateEmail = (value: string) => {
  if (!value) {
    setEmailError('Email is required');
    return false;
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    setEmailError('Please enter a valid email address');
    return false;
  }
  
  setEmailError('');
  return true;
};

<Input
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    validateEmail(e.target.value);
  }}
  error={emailError}
  success={!emailError && email.length > 0}
  required
/>
```

## Best Practices

### Form Layout
```tsx
<form className="space-y-6">
  <Input label="First Name" required />
  <Input label="Last Name" required />
  <Input label="Email" type="email" required />
  <Select label="Country" required>
    <SelectItem value="us">United States</SelectItem>
    <SelectItem value="ca">Canada</SelectItem>
  </Select>
  <Textarea label="Message" rows={4} />
  
  <div className="flex gap-3">
    <Button type="submit" variant="primary">Submit</Button>
    <Button type="button" variant="outline">Cancel</Button>
  </div>
</form>
```

### Error Handling
```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

const validateForm = () => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.name) newErrors.name = 'Name is required';
  if (!formData.email) newErrors.email = 'Email is required';
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// In render
<Input
  label="Name"
  value={formData.name}
  onChange={(e) => handleChange('name', e.target.value)}
  error={errors.name}
  required
/>
```

### Responsive Design
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Input label="First Name" />
  <Input label="Last Name" />
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <Select label="Country" />
  <Select label="State" />
  <Input label="Zip Code" />
</div>
```

## Testing

The form components include comprehensive tests covering:

- Rendering with props
- Error and success states
- User interactions
- Accessibility features
- Keyboard navigation
- Form validation

Run tests with:
```bash
npm run test -- src/test/form-components.test.tsx
```

## Migration Guide

### From Old Components

```tsx
// Old way
<input 
  className="border rounded px-3 py-2" 
  placeholder="Enter text"
/>

// New way
<Input
  label="Field Label"
  placeholder="Enter text"
  helpText="Additional context"
/>
```

### Updating Existing Forms

1. Replace `<input>` with `<Input>`
2. Add `label` prop for accessibility
3. Use `error` prop instead of custom error handling
4. Add `helpText` for better UX
5. Use `required` prop for required fields

## Demo

See the complete form components demo at `/test-dashboard` → Form Components tab.

The demo showcases:
- All component variants and sizes
- Error and success states
- Accessibility features
- Interactive examples
- Best practices