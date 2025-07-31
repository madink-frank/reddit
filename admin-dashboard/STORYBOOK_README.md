# Storybook Documentation

This document provides comprehensive information about the Storybook setup for the Reddit Content Platform admin dashboard.

## Overview

Storybook is a tool for building UI components and pages in isolation. It streamlines UI development, testing, and documentation by allowing you to create stories for your components.

## Getting Started

### Running Storybook

To start the Storybook development server:

```bash
npm run storybook
```

This will start Storybook on `http://localhost:6006`.

### Building Storybook

To build a static version of Storybook for deployment:

```bash
npm run build-storybook
```

The built files will be in the `storybook-static` directory.

## Project Structure

```
admin-dashboard/
├── .storybook/
│   ├── main.ts          # Storybook configuration
│   └── preview.ts       # Global settings and decorators
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.stories.tsx
│   │   │   ├── Input.stories.tsx
│   │   │   └── ...
│   │   └── dashboard/
│   │       ├── StatCard.stories.tsx
│   │       └── ...
│   └── stories/
│       ├── DesignTokens.stories.tsx
│       └── ComponentDocumentation.stories.tsx
```

## Story Categories

### 1. UI Components (`UI/`)
Basic building blocks of the interface:
- **Button**: Interactive elements with multiple variants
- **Input**: Form input fields with validation states
- **Select**: Dropdown selection components
- **Card**: Container components

### 2. Dashboard Components (`Dashboard/`)
Specialized components for the dashboard:
- **StatCard**: Metric display cards with trends
- **Charts**: Data visualization components
- **Navigation**: Header and sidebar components

### 3. Design System (`Design System/`)
Documentation and guidelines:
- **Design Tokens**: Colors, typography, spacing
- **Component Documentation**: Usage guidelines
- **Accessibility**: A11y features and best practices

## Writing Stories

### Basic Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default story',
  },
};
```

### Story Best Practices

1. **Use descriptive names**: Story names should clearly indicate what they demonstrate
2. **Include documentation**: Add descriptions explaining the component's purpose
3. **Show all variants**: Create stories for different states and configurations
4. **Use realistic data**: Use meaningful content that reflects real usage
5. **Test accessibility**: Include accessibility-focused stories

### Controls and Args

Storybook controls allow interactive testing of component props:

```typescript
argTypes: {
  variant: {
    control: 'select',
    options: ['primary', 'secondary', 'outline'],
    description: 'Visual style variant',
  },
  size: {
    control: 'select',
    options: ['sm', 'md', 'lg'],
  },
  disabled: {
    control: 'boolean',
  },
  onClick: { action: 'clicked' },
}
```

## Addons

The following addons are configured:

### Essential Addons
- **Controls**: Interactive controls for component props
- **Actions**: Log component interactions
- **Viewport**: Test responsive design
- **Backgrounds**: Test components on different backgrounds
- **Docs**: Auto-generated documentation

### Accessibility Addon
- **a11y**: Automated accessibility testing
- Highlights accessibility violations
- Provides suggestions for improvements

### Additional Features
- **Links**: Navigate between related stories
- **Interactions**: Test user interactions
- **Docs**: Comprehensive documentation generation

## Design Tokens Integration

Design tokens are documented in Storybook to ensure consistency:

### Colors
- Primary color palette
- Semantic colors (success, warning, error)
- Neutral grays
- Accessibility-compliant contrast ratios

### Typography
- Font families (Inter, JetBrains Mono)
- Font sizes and scales
- Font weights and line heights

### Spacing
- Consistent spacing scale
- Margin and padding values
- Component spacing guidelines

### Other Tokens
- Border radius values
- Shadow definitions
- Breakpoint specifications

## Accessibility Testing

Storybook includes built-in accessibility testing:

### Automated Testing
- Color contrast validation
- ARIA label checking
- Keyboard navigation testing
- Screen reader compatibility

### Manual Testing
- Test with keyboard navigation
- Verify screen reader announcements
- Check color accessibility
- Validate focus management

## Component Documentation

Each component story includes:

### Usage Examples
- Basic usage patterns
- Common configurations
- Edge cases and error states

### Props Documentation
- Prop types and descriptions
- Default values
- Required vs optional props

### Accessibility Information
- ARIA attributes used
- Keyboard interactions
- Screen reader behavior

### Design Guidelines
- When to use the component
- Visual hierarchy considerations
- Responsive behavior

## Development Workflow

### Creating New Stories

1. Create a `.stories.tsx` file next to your component
2. Import the component and Storybook types
3. Define the meta configuration
4. Create individual stories for different states
5. Add controls and documentation
6. Test accessibility features

### Updating Existing Stories

1. Keep stories in sync with component changes
2. Add new stories for new features
3. Update documentation as needed
4. Verify accessibility compliance

### Review Process

1. Stories should be reviewed alongside component code
2. Ensure documentation is accurate and helpful
3. Test stories in different viewports
4. Verify accessibility compliance

## Deployment

Storybook can be deployed as a static site:

### Build Process
```bash
npm run build-storybook
```

### Deployment Options
- Netlify/Vercel for static hosting
- GitHub Pages for open source projects
- Internal hosting for private documentation

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure all dependencies are installed
2. **CSS not loading**: Check that styles are imported in preview.ts
3. **Controls not working**: Verify argTypes configuration
4. **Stories not appearing**: Check file naming and exports

### Performance

- Use lazy loading for large components
- Optimize images and assets
- Consider code splitting for large story sets

## Contributing

When adding new components:

1. Create comprehensive stories covering all variants
2. Include accessibility testing
3. Add proper documentation
4. Follow naming conventions
5. Test in multiple browsers

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Accessibility Guidelines](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- [Design System Best Practices](https://storybook.js.org/tutorials/design-systems-for-developers/)