import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatCard } from '../components/dashboard/StatCard';
import { Users, Mail, TrendingUp } from 'lucide-react';

/**
 * Component Documentation showcasing how to use the main UI components together.
 * This serves as a comprehensive guide for developers using the design system.
 */
const meta: Meta = {
  title: 'Design System/Component Documentation',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Component Documentation

This documentation provides comprehensive guidance on using the UI components in the Reddit Content Platform admin dashboard.

## Component Categories

### UI Components
- **Button**: Primary interaction element with multiple variants and states
- **Input**: Form input fields with validation and accessibility features
- **Select**: Dropdown selection component
- **Card**: Container component for grouping related content

### Dashboard Components
- **StatCard**: Displays key metrics and statistics
- **Chart Components**: Various chart types for data visualization
- **Navigation**: Header and sidebar navigation components

### Form Components
- **Form**: Complete form wrapper with validation
- **Field Groups**: Related form fields grouped together
- **Validation**: Error handling and success states

## Usage Guidelines

### Consistency
- Always use design tokens for colors, spacing, and typography
- Follow the established component patterns
- Maintain consistent spacing and alignment

### Accessibility
- All components include proper ARIA labels
- Keyboard navigation is supported
- Color contrast meets WCAG guidelines
- Screen reader compatibility is ensured

### Responsive Design
- Components adapt to different screen sizes
- Touch-friendly on mobile devices
- Consistent behavior across breakpoints

## Best Practices

1. **Use semantic HTML**: Components use appropriate HTML elements
2. **Follow naming conventions**: Consistent prop and class naming
3. **Handle loading states**: Show appropriate feedback during async operations
4. **Provide error handling**: Clear error messages and recovery options
5. **Test accessibility**: Regular testing with screen readers and keyboard navigation
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic component usage examples
 */
export const BasicUsage: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Basic Component Usage</h2>

        {/* Button Examples */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Buttons</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-medium mb-2">Primary Actions</h4>
              <div className="flex gap-4">
                <Button variant="primary">Save Changes</Button>
                <Button variant="primary" icon={Users}>Add User</Button>
                <Button variant="primary" loading>Processing...</Button>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium mb-2">Secondary Actions</h4>
              <div className="flex gap-4">
                <Button variant="secondary">Cancel</Button>
                <Button variant="outline">Edit</Button>
                <Button variant="ghost">View Details</Button>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium mb-2">Semantic Actions</h4>
              <div className="flex gap-4">
                <Button variant="success">Approve</Button>
                <Button variant="warning">Review</Button>
                <Button variant="destructive">Delete</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Input Examples */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Form Inputs</h3>
          <div className="max-w-md space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              leftIcon={Mail}
            />
            <Input
              label="Search"
              placeholder="Search users..."
              variant="filled"
            />
            <Input
              label="Required Field"
              placeholder="This field is required"
              required
              helpText="Please provide a value"
            />
            <Input
              label="Error State"
              placeholder="Invalid input"
              error="This field contains an error"
            />
          </div>
        </div>

        {/* StatCard Examples */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Statistics Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Users"
              value={12543}
              change={{ value: 12.5, type: 'increase' }}
              icon={Users}
              iconColor="text-blue-600"
              bgGradient="from-blue-500 to-blue-600"
            />
            <StatCard
              title="Active Sessions"
              value={892}
              change={{ value: 3.2, type: 'decrease' }}
              icon={TrendingUp}
              iconColor="text-green-600"
              bgGradient="from-green-500 to-green-600"
            />
            <StatCard
              title="Server Uptime"
              value="99.9%"
              trend="stable"
              icon={TrendingUp}
              iconColor="text-purple-600"
              bgGradient="from-purple-500 to-purple-600"
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Form composition examples
 */
export const FormComposition: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Form Composition</h2>

        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-6">User Registration Form</h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="Enter first name"
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Enter last name"
                  required
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="Enter email address"
                leftIcon={Mail}
                required
                helpText="We'll never share your email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Create a password"
                required
                helpText="Must be at least 8 characters"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                required
              />

              <div className="flex gap-4 pt-4">
                <Button variant="primary" fullWidth>
                  Create Account
                </Button>
                <Button variant="outline" fullWidth>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Dashboard layout examples
 */
export const DashboardLayout: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Dashboard Layout</h2>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Dashboard Overview</h3>
                <p className="text-gray-600 mt-1">Welcome back! Here's what's happening.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">Export</Button>
                <Button variant="primary" size="sm">Add New</Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={12543}
              change={{ value: 12.5, type: 'increase' }}
              icon={Users}
              iconColor="text-blue-600"
              bgGradient="from-blue-500 to-blue-600"
              variant="gradient"
            />
            <StatCard
              title="Active Sessions"
              value={892}
              change={{ value: 3.2, type: 'decrease' }}
              icon={TrendingUp}
              iconColor="text-green-600"
              variant="glass"
            />
            <StatCard
              title="Revenue"
              value="$45,231"
              change={{ value: 8.7, type: 'increase' }}
              icon={TrendingUp}
              iconColor="text-purple-600"
              variant="elevated"
            />
            <StatCard
              title="Conversion Rate"
              value="3.24%"
              trend="up"
              icon={TrendingUp}
              iconColor="text-orange-600"
              variant="colorful"
            />
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-lg font-semibold mb-4">Recent Activity</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>New user registration</span>
                  <span className="text-sm text-gray-500">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>System backup completed</span>
                  <span className="text-sm text-gray-500">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Database optimization</span>
                  <span className="text-sm text-gray-500">3 hours ago</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-lg font-semibold mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Button variant="outline" fullWidth size="sm">
                  Generate Report
                </Button>
                <Button variant="outline" fullWidth size="sm">
                  Backup Database
                </Button>
                <Button variant="outline" fullWidth size="sm">
                  System Settings
                </Button>
                <Button variant="primary" fullWidth size="sm">
                  Add New User
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Accessibility features demonstration
 */
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Accessibility Features</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Keyboard Navigation</h3>
            <p className="text-gray-600 mb-4">
              All interactive elements can be accessed using keyboard navigation.
              Use Tab to move forward, Shift+Tab to move backward, and Enter/Space to activate.
            </p>
            <div className="flex gap-4">
              <Button variant="primary">First Button</Button>
              <Button variant="secondary">Second Button</Button>
              <Button variant="outline">Third Button</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Screen Reader Support</h3>
            <p className="text-gray-600 mb-4">
              Components include proper ARIA labels and descriptions for screen readers.
            </p>
            <div className="max-w-md space-y-4">
              <Input
                label="Accessible Input"
                placeholder="This input has proper labels"
                aria-describedby="input-help"
                helpText="This helper text is announced by screen readers"
              />
              <Button
                variant="primary"
                aria-label="Save document and return to dashboard"
              >
                Save
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Color Accessibility</h3>
            <p className="text-gray-600 mb-4">
              Components meet WCAG color contrast requirements and provide alternative indicators.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Success State"
                value="98.5%"
                change={{ value: 2.1, type: 'increase' }}
                icon={TrendingUp}
                iconColor="text-green-600"
                bgGradient="from-green-500 to-green-600"
              />
              <StatCard
                title="Warning State"
                value="12"
                change={{ value: 0, type: 'neutral' }}
                icon={TrendingUp}
                iconColor="text-yellow-600"
                bgGradient="from-yellow-500 to-yellow-600"
              />
              <StatCard
                title="Error State"
                value="3"
                change={{ value: 1.5, type: 'decrease' }}
                icon={TrendingUp}
                iconColor="text-red-600"
                bgGradient="from-red-500 to-red-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};