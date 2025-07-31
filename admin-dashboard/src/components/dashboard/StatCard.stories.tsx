import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from './StatCard';
import { Users, TrendingUp, DollarSign, Activity, Eye, MessageSquare, Heart, Share } from 'lucide-react';

/**
 * StatCard displays key metrics and statistics with visual indicators for changes and trends.
 * It supports multiple variants, loading states, and accessibility features.
 */
const meta: Meta<typeof StatCard> = {
  title: 'Dashboard/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The StatCard component is used to display important metrics and statistics in the dashboard.

## Features
- Multiple visual variants (default, gradient, colorful, glass, elevated)
- Change indicators with percentage and trend arrows
- Loading states with skeleton animation
- Progress bar support
- Full accessibility support with ARIA labels
- Color accessibility preferences integration
- Responsive design
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'gradient', 'colorful', 'glass', 'elevated'],
      description: 'Visual style variant of the card',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading skeleton when true',
    },
    trend: {
      control: 'select',
      options: ['up', 'down', 'stable'],
      description: 'Overall trend indicator',
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress bar value (0-100)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic stat card showing user count
 */
export const Default: Story = {
  args: {
    title: 'Total Users',
    value: 12543,
    icon: Users,
    iconColor: 'text-blue-600',
    bgGradient: 'from-blue-500 to-blue-600',
  },
};

/**
 * Stat card with positive change indicator
 */
export const WithPositiveChange: Story = {
  args: {
    title: 'Monthly Revenue',
    value: '$45,231',
    change: {
      value: 12.5,
      type: 'increase',
    },
    icon: DollarSign,
    iconColor: 'text-green-600',
    bgGradient: 'from-green-500 to-green-600',
  },
};

/**
 * Stat card with negative change indicator
 */
export const WithNegativeChange: Story = {
  args: {
    title: 'Bounce Rate',
    value: '23.4%',
    change: {
      value: 3.2,
      type: 'decrease',
    },
    icon: TrendingUp,
    iconColor: 'text-red-600',
    bgGradient: 'from-red-500 to-red-600',
  },
};

/**
 * Stat card with neutral change
 */
export const WithNeutralChange: Story = {
  args: {
    title: 'Server Uptime',
    value: '99.9%',
    change: {
      value: 0,
      type: 'neutral',
    },
    icon: Activity,
    iconColor: 'text-gray-600',
    bgGradient: 'from-gray-500 to-gray-600',
  },
};

/**
 * Stat card with trend indicator
 */
export const WithTrend: Story = {
  args: {
    title: 'Page Views',
    value: 89432,
    trend: 'up',
    icon: Eye,
    iconColor: 'text-purple-600',
    bgGradient: 'from-purple-500 to-purple-600',
  },
};

/**
 * Stat card in loading state
 */
export const Loading: Story = {
  args: {
    title: 'Loading Data',
    value: 0,
    loading: true,
    icon: Users,
  },
};

/**
 * Glass variant stat card
 */
export const GlassVariant: Story = {
  args: {
    title: 'Comments',
    value: 1247,
    variant: 'glass',
    change: {
      value: 8.3,
      type: 'increase',
    },
    icon: MessageSquare,
    iconColor: 'text-indigo-600',
  },
};

/**
 * Elevated variant stat card
 */
export const ElevatedVariant: Story = {
  args: {
    title: 'Likes',
    value: 5632,
    variant: 'elevated',
    change: {
      value: 15.7,
      type: 'increase',
    },
    icon: Heart,
    iconColor: 'text-pink-600',
  },
};

/**
 * Colorful variant stat card
 */
export const ColorfulVariant: Story = {
  args: {
    title: 'Shares',
    value: 892,
    variant: 'colorful',
    change: {
      value: 4.2,
      type: 'increase',
    },
    icon: Share,
    iconColor: 'text-orange-600',
  },
};

/**
 * Stat card with progress bar
 */
export const WithProgress: Story = {
  args: {
    title: 'Storage Used',
    value: '67.3 GB',
    progress: 67,
    icon: Activity,
    iconColor: 'text-blue-600',
    bgGradient: 'from-blue-500 to-blue-600',
  },
};

/**
 * Large number formatting example
 */
export const LargeNumbers: Story = {
  args: {
    title: 'Total Impressions',
    value: 1234567,
    change: {
      value: 23.8,
      type: 'increase',
    },
    icon: Eye,
    iconColor: 'text-cyan-600',
    bgGradient: 'from-cyan-500 to-cyan-600',
  },
};

/**
 * All variants displayed together
 */
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <StatCard
        title="Default"
        value={12543}
        variant="default"
        icon={Users}
        iconColor="text-blue-600"
      />
      <StatCard
        title="Gradient"
        value="$45,231"
        variant="gradient"
        change={{ value: 12.5, type: 'increase' }}
        icon={DollarSign}
        iconColor="text-green-600"
        bgGradient="from-green-500 to-green-600"
      />
      <StatCard
        title="Glass"
        value={1247}
        variant="glass"
        change={{ value: 8.3, type: 'increase' }}
        icon={MessageSquare}
        iconColor="text-indigo-600"
      />
      <StatCard
        title="Elevated"
        value={5632}
        variant="elevated"
        change={{ value: 15.7, type: 'increase' }}
        icon={Heart}
        iconColor="text-pink-600"
      />
      <StatCard
        title="Colorful"
        value={892}
        variant="colorful"
        change={{ value: 4.2, type: 'increase' }}
        icon={Share}
        iconColor="text-orange-600"
      />
      <StatCard
        title="With Trend"
        value={89432}
        variant="gradient"
        trend="up"
        icon={Eye}
        iconColor="text-purple-600"
        bgGradient="from-purple-500 to-purple-600"
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};