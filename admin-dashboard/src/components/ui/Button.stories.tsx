import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Plus, Download, Trash2, Settings } from 'lucide-react';

/**
 * The Button component is a versatile UI element that supports multiple variants, sizes, and states.
 * It includes accessibility features like ARIA attributes, keyboard navigation, and screen reader support.
 */
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Button component provides a consistent interface for user interactions across the application.

## Features
- Multiple variants (primary, secondary, outline, ghost, destructive, success, warning)
- Three sizes (sm, md, lg)
- Loading states with spinner
- Icon support with configurable position
- Full accessibility support
- Color accessibility preferences integration
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'success', 'warning'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner when true',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button when true',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes button take full width of container',
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position of the icon relative to text',
    },
    onClick: { action: 'clicked' },
  },
  args: {
    onClick: () => console.log('Button clicked'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default primary button style
 */
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

/**
 * Secondary button with subtle styling
 */
export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

/**
 * Outline button with border styling
 */
export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

/**
 * Ghost button with minimal styling
 */
export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

/**
 * Destructive button for dangerous actions
 */
export const Destructive: Story = {
  args: {
    children: 'Delete Item',
    variant: 'destructive',
    icon: Trash2,
  },
};

/**
 * Success button for positive actions
 */
export const Success: Story = {
  args: {
    children: 'Save Changes',
    variant: 'success',
  },
};

/**
 * Warning button for cautionary actions
 */
export const Warning: Story = {
  args: {
    children: 'Proceed with Caution',
    variant: 'warning',
  },
};

/**
 * Small size button
 */
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

/**
 * Large size button
 */
export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

/**
 * Button with left-positioned icon
 */
export const WithLeftIcon: Story = {
  args: {
    children: 'Add Item',
    icon: Plus,
    iconPosition: 'left',
  },
};

/**
 * Button with right-positioned icon
 */
export const WithRightIcon: Story = {
  args: {
    children: 'Download',
    icon: Download,
    iconPosition: 'right',
  },
};

/**
 * Button in loading state
 */
export const Loading: Story = {
  args: {
    children: 'Processing...',
    loading: true,
  },
};

/**
 * Disabled button state
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

/**
 * Full width button
 */
export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

/**
 * Icon-only button
 */
export const IconOnly: Story = {
  args: {
    icon: Settings,
    'aria-label': 'Settings',
  },
};

/**
 * All button variants displayed together
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * All button sizes displayed together
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};