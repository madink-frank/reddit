# Design Token System

This design system provides a comprehensive set of design tokens and utility classes for consistent UI development.

## Overview

The design system includes:
- **Colors**: Primary, secondary, semantic, and status colors
- **Typography**: Font families, sizes, weights, and line heights
- **Spacing**: Consistent spacing scale for margins, padding, and gaps
- **Components**: Pre-styled component classes
- **Animations**: Smooth transitions and animations
- **Icons**: Standardized icon sizes

## Usage

### CSS Custom Properties

All design tokens are available as CSS custom properties:

```css
.my-component {
  color: var(--color-text-primary);
  background-color: var(--color-surface-primary);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
}
```

### Utility Classes

Use utility classes for rapid development:

```html
<div class="bg-surface p-6 rounded-lg shadow-md">
  <h2 class="heading-3 text-primary mb-4">Title</h2>
  <p class="body-base text-secondary">Content</p>
</div>
```

### TypeScript Constants

Import design tokens in TypeScript/React components:

```tsx
import { ICON_SIZES, BUTTON_VARIANTS, getButtonClass } from '../constants/design-tokens';

// Use in components
<Icon size="lg" />
<Button variant="primary" size="md">Click me</Button>
```

## Color System

### Primary Colors
- `--color-primary-50` to `--color-primary-950`
- Utility classes: `.text-primary`, `.bg-primary`, `.border-primary`

### Semantic Colors
- Success: `--color-success-500`, `.text-success`, `.bg-success`
- Warning: `--color-warning-500`, `.text-warning`, `.bg-warning`
- Error: `--color-error-500`, `.text-error`, `.bg-error`
- Info: `--color-info-500`, `.text-info`, `.bg-info`

### Text Colors
- Primary: `--color-text-primary` (main text)
- Secondary: `--color-text-secondary` (supporting text)
- Tertiary: `--color-text-tertiary` (subtle text)
- Disabled: `--color-text-disabled` (disabled state)

## Typography

### Headings
```html
<h1 class="heading-1">Main Title</h1>
<h2 class="heading-2">Section Title</h2>
<h3 class="heading-3">Subsection</h3>
```

### Body Text
```html
<p class="body-large">Large body text</p>
<p class="body-base">Regular body text</p>
<p class="body-small">Small body text</p>
```

### Font Sizes
- `text-xs` (12px)
- `text-sm` (14px)
- `text-base` (16px)
- `text-lg` (18px)
- `text-xl` (20px)
- `text-2xl` (24px)

## Spacing

### Scale
- `space-1` (4px)
- `space-2` (8px)
- `space-4` (16px)
- `space-6` (24px)
- `space-8` (32px)
- `space-12` (48px)

### Semantic Spacing
- `space-xs` (4px)
- `space-sm` (8px)
- `space-md` (16px)
- `space-lg` (24px)
- `space-xl` (32px)

### Usage
```html
<div class="p-4 m-2 gap-3">
  <div class="px-6 py-3">Content</div>
</div>
```

## Components

### Buttons
```html
<button class="btn btn-primary btn-md">Primary Button</button>
<button class="btn btn-secondary btn-sm">Secondary Button</button>
<button class="btn btn-outline btn-lg">Outline Button</button>
```

### Cards
```html
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">
    <p>Card content</p>
  </div>
</div>
```

### Form Elements
```html
<input class="input" type="text" placeholder="Enter text">
<select class="select">
  <option>Option 1</option>
</select>
<input class="checkbox" type="checkbox">
```

### Badges
```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
```

## Icons

### Sizes
- `icon-xs` (12px)
- `icon-sm` (16px)
- `icon` (20px) - default
- `icon-md` (24px)
- `icon-lg` (32px)
- `icon-xl` (48px)
- `icon-2xl` (64px)

### Usage in React
```tsx
import { Icon } from '../components/ui/Icon';

<Icon name="dashboard" size="lg" />
<Icon name="search" size="sm" className="text-secondary" />
```

## Animations

### Fade Animations
```html
<div class="animate-fade-in">Fades in</div>
<div class="animate-fade-in-up">Fades in from bottom</div>
```

### Scale Animations
```html
<div class="animate-scale-in">Scales in</div>
<button class="hover-scale">Scales on hover</button>
```

### Loading States
```html
<div class="animate-pulse">Pulsing loader</div>
<div class="animate-spin">Spinning loader</div>
<div class="skeleton skeleton-text">Loading text</div>
```

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Usage
```html
<div class="hidden sm:block md:flex lg:grid">
  Responsive visibility
</div>
```

## Dark Mode Support

The design system includes automatic dark mode support based on user preferences:

```css
@media (prefers-color-scheme: dark) {
  /* Dark mode styles are automatically applied */
}
```

## Accessibility

### Focus States
All interactive elements include proper focus indicators:
```html
<button class="btn focus-ring">Accessible button</button>
```

### Screen Reader Support
```html
<span class="sr-only">Screen reader only text</span>
```

### High Contrast Support
The system automatically adapts to high contrast preferences.

## Best Practices

1. **Use semantic tokens**: Prefer `--color-text-primary` over specific color values
2. **Consistent spacing**: Use the spacing scale for all margins and padding
3. **Component classes**: Use pre-built component classes when available
4. **Responsive design**: Test on all breakpoints
5. **Accessibility**: Always include proper ARIA labels and focus states

## Migration Guide

### From Tailwind Classes
```html
<!-- Before -->
<div class="bg-white p-4 rounded-lg shadow-sm border">

<!-- After -->
<div class="bg-surface p-4 rounded-lg shadow-sm border-primary">
```

### From Custom CSS
```css
/* Before */
.my-button {
  background-color: #3b82f6;
  padding: 8px 16px;
  border-radius: 8px;
}

/* After */
.my-button {
  background-color: var(--color-interactive-primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
}
```

## Performance

The design system is optimized for performance:
- CSS custom properties for runtime theming
- Minimal CSS bundle size
- GPU-accelerated animations
- Reduced motion support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties support required
- Graceful degradation for older browsers