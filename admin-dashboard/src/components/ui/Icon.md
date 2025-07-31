# Icon Standardization System

## Overview

The Icon component provides a standardized way to use icons throughout the application with consistent sizing, accessibility, and performance.

## Features

- **Standardized Sizing**: Uses design tokens for consistent icon sizes
- **Context-Aware**: Automatic size selection based on usage context
- **Accessibility**: Built-in ARIA labels and semantic markup
- **Performance**: Inline SVG for optimal loading
- **TypeScript**: Full type safety for icon names and sizes

## Usage

### Basic Usage

```tsx
import { Icon } from '@/components/ui/Icon';

// Default size (20px)
<Icon name="dashboard" />

// Explicit size
<Icon name="dashboard" size="md" />

// With styling
<Icon name="dashboard" size="lg" className="text-blue-500" />
```

### Context-Aware Sizing

```tsx
// Automatically uses appropriate size for context
<Icon name="dashboard" context="button-medium" />
<Icon name="search" context="form-field" />
<Icon name="user" context="nav-item" />
```

## Icon Sizes

| Size | CSS Class | Pixels | Usage |
|------|-----------|--------|-------|
| `xs` | `icon-xs` | 12px | Small inline icons |
| `sm` | `icon-sm` | 16px | Form fields, buttons, table cells |
| `base` | `icon` | 20px | Default size, navigation, status |
| `md` | `icon-md` | 24px | Card headers, medium buttons |
| `lg` | `icon-lg` | 32px | Section headers, large buttons |
| `xl` | `icon-xl` | 48px | Login page, hero sections |
| `2xl` | `icon-2xl` | 64px | Hero icons, empty states |

## Context Guidelines

### Interactive Elements
- **Small buttons**: `sm` (16px)
- **Medium buttons**: `base` (20px)
- **Large buttons**: `md` (24px)
- **Dropdown items**: `sm` (16px)

### Navigation
- **Sidebar menu**: `base` (20px)
- **Tab icons**: `base` (20px)
- **Breadcrumbs**: `sm` (16px)

### Content Areas
- **Card headers**: `md` (24px)
- **Section headers**: `lg` (32px)
- **Page headers**: `lg` (32px)

### Status & Feedback
- **Status indicators**: `base` (20px)
- **Alert icons**: `base` (20px)
- **Loading spinners**: `base` (20px)

## Migration from Tailwind Classes

Replace Tailwind size classes with design token classes:

```tsx
// ❌ Old way
<Icon className="h-4 w-4" />
<Icon className="h-5 w-5" />
<Icon className="h-6 w-6" />

// ✅ New way
<Icon size="sm" />
<Icon size="base" />
<Icon size="md" />
```

## Available Icons

The Icon component supports the following icons:

### Navigation
- `dashboard`, `keywords`, `posts`, `analytics`, `content`, `monitoring`

### Actions
- `search`, `filter`, `sort`, `edit`, `delete`, `add`, `refresh`
- `download`, `upload`, `settings`, `user`, `logout`

### Status
- `loading`, `check`, `close`

### Arrows & Chevrons
- `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`
- `chevron-up`, `chevron-down`, `chevron-left`, `chevron-right`

### Interface
- `eye`, `eye-off`, `heart`, `star`, `bookmark`, `share`, `link`

### Data
- `calendar`, `clock`, `chart-bar`, `chart-line`, `chart-pie`

## Accessibility

The Icon component automatically includes:

- `role="img"` for screen readers
- `aria-label` with icon name or custom label
- Proper semantic markup

```tsx
// Custom accessibility label
<Icon name="dashboard" aria-label="Go to dashboard" />
```

## Performance

- Icons are inline SVG for optimal performance
- No external icon font loading
- Tree-shakable icon definitions
- Minimal bundle impact

## Development Tools

### Migration Report

Run this in the browser console to find non-standard icon sizes:

```javascript
import { generateMigrationReport } from '@/constants/icon-standards';
generateMigrationReport();
```

### Size Validation

```typescript
import { validateIconSize } from '@/constants/icon-standards';

// Check if size is appropriate for context
const isValid = validateIconSize('md', 'button-medium'); // true
```

## Best Practices

1. **Use context-aware sizing** when possible
2. **Be consistent** within similar UI elements
3. **Consider accessibility** when choosing sizes
4. **Test on different screen sizes**
5. **Use semantic names** over explicit sizes when context is clear

## Examples

### Dashboard Stat Card
```tsx
<div className="stat-card">
  <Icon name="chart-bar" size="md" className="text-blue-500" />
  <span>Revenue</span>
</div>
```

### Navigation Menu
```tsx
<nav>
  <Icon name="dashboard" context="nav-item" />
  <span>Dashboard</span>
</nav>
```

### Button with Icon
```tsx
<Button>
  <Icon name="add" context="button-medium" />
  Add Item
</Button>
```

### Status Indicator
```tsx
<div className="status">
  <Icon name="check" context="status-indicator" className="text-green-500" />
  <span>Active</span>
</div>
```