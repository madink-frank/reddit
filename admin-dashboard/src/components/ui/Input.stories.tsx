import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { 
  Mail, 
  Search, 
  User, 
  Lock, 
  Eye, 
  Phone, 
  MapPin, 
  Calendar,
  CreditCard,
  DollarSign,
  Globe,
  Heart,
  Star,
  Settings,
  Filter,
  Download,
  Upload,
  Send,
  Check,
  X
} from 'lucide-react';


/**
 * Input component provides a consistent interface for text input across the application.
 * It includes validation states, icons, and accessibility features.
 */
const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Input component is a flexible form input that supports various states and configurations.

## Features
- Multiple variants (default, filled, outlined)
- Validation states (error, success, warning)
- Icon support (left and right positioned)
- Loading states
- Disabled states
- Full accessibility support
- Keyboard navigation
- Screen reader support

## Icon Support

The Input component supports both left and right icons to enhance the user experience and provide visual context.

### Icon Types
- **React Components**: Pass Lucide icons or other React icon components
- **JSX Elements**: Pass custom SVG elements or other JSX content

### Icon Positioning
- **Left Icons**: Always visible, positioned on the left side of the input
- **Right Icons**: Positioned on the right side, but hidden when state indicators are present
- **State Precedence**: Success and error indicators take precedence over right icons

### Icon Sizing
Icons automatically scale based on input size:
- Small (sm): 14px icons
- Medium (md): 16px icons  
- Large (lg): 18px icons

### Best Practices

#### When to Use Left Icons
- **Context Indicators**: Email (✉️), Phone (📞), Search (🔍)
- **Field Type**: User (👤), Password (🔒), Location (📍)
- **Visual Hierarchy**: Help users quickly identify field types

#### When to Use Right Icons
- **Actions**: Send (➤), Clear (✕), Toggle visibility (👁️)
- **Status**: Loading, validation feedback
- **Interactive Elements**: Dropdown arrows, calendar pickers

#### Icon Selection Guidelines
- Use familiar, universally recognized icons
- Maintain consistency across similar field types
- Ensure icons are decorative (aria-hidden="true")
- Consider cultural context and accessibility

#### Accessibility Considerations
- Icons are automatically marked with aria-hidden="true"
- Screen readers focus on labels and help text, not icons
- Icons should supplement, not replace, clear labeling
- Maintain sufficient color contrast for icon visibility

#### Custom Styling
Use \`leftIconClassName\` and \`rightIconClassName\` props to customize icon appearance:
- Color: \`text-blue-500\`, \`text-red-600\`
- Size adjustments: \`w-5 h-5\` (though automatic sizing is recommended)
- Hover effects: \`hover:text-primary\`

### Examples

\`\`\`tsx
// Basic left icon
<Input leftIcon={Mail} placeholder="Email address" />

// Both icons
<Input leftIcon={User} rightIcon={Settings} placeholder="Username" />

// Custom styling
<Input 
  leftIcon={Heart} 
  leftIconClassName="text-red-500" 
  placeholder="Favorite item" 
/>

// JSX element icon
<Input 
  leftIcon={<span>🔍</span>} 
  placeholder="Search with emoji" 
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'outlined'],
      description: 'Visual style variant of the input',
    },
    success: {
      control: 'boolean',
      description: 'Shows success state when true',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input when true',
    },
    helpText: {
      control: 'text',
      description: 'Helper text to display below input',
    },
    label: {
      control: 'text',
      description: 'Label for the input field',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    type: {
      control: 'text',
      description: 'Input type (text, email, password, etc.)',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    leftIcon: {
      control: false,
      description: 'Icon component or JSX element to display on the left side',
    },
    rightIcon: {
      control: false,
      description: 'Icon component or JSX element to display on the right side',
    },
    leftIconClassName: {
      control: 'text',
      description: 'Additional CSS classes for the left icon',
    },
    rightIconClassName: {
      control: 'text',
      description: 'Additional CSS classes for the right icon',
    },
    onChange: { action: 'changed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
  },
  args: {
    onChange: (e: { target: { value: any; }; }) => console.log('Input changed:', e.target.value),
    onFocus: () => console.log('Input focused'),
    onBlur: () => console.log('Input blurred'),
  },
};

export default meta;
type Story = StoryObj<Meta<typeof Input>>;

/**
 * Default input field
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

/**
 * Input with label
 */
export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

/**
 * Input with helper text
 */
export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    helpText: 'Must be at least 3 characters long',
  },
};

/**
 * Input in error state
 */
export const ErrorState: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    type: 'password',
    error: 'Password must be at least 8 characters',
  },
};

/**
 * Input in success state
 */
export const SuccessState: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter email',
    type: 'email',
    success: true,
    value: 'user@example.com',
  },
};

/**
 * Input with helper text (warning style)
 */
export const WithWarning: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    value: 'ab',
    helpText: 'Username is too short',
  },
};

/**
 * Password input
 */
export const PasswordInput: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    type: 'password',
  },
};

/**
 * Small size input
 */
export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size',
    size: 'sm',
  },
};

/**
 * Large size input
 */
export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size',
    size: 'lg',
  },
};

/**
 * Filled variant input
 */
export const Filled: Story = {
  args: {
    label: 'Filled Input',
    placeholder: 'Filled variant',
    variant: 'filled',
  },
};

/**
 * Outlined variant input
 */
export const Outlined: Story = {
  args: {
    label: 'Outlined Input',
    placeholder: 'Outlined variant',
    variant: 'outlined',
  },
};

/**
 * Disabled input
 */
export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
    value: 'Disabled value',
  },
};

/**
 * Full width input (default behavior)
 */
export const FullWidth: Story = {
  args: {
    label: 'Full Width Input',
    placeholder: 'Takes full width',
  },
  parameters: {
    layout: 'padded',
  },
};

/**
 * Required input with asterisk
 */
export const Required: Story = {
  args: {
    label: 'Required Field',
    placeholder: 'This field is required',
    required: true,
  },
};

/**
 * All input variants displayed together
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Default"
        placeholder="Default variant"
        variant="default"
      />
      <Input
        label="Filled"
        placeholder="Filled variant"
        variant="filled"
      />
      <Input
        label="Outlined"
        placeholder="Outlined variant"
        variant="outlined"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * All input states displayed together
 */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Default State"
        placeholder="Default state"
      />
      <Input
        label="Success State"
        placeholder="Success state"
        success={true}
        value="Valid input"
      />
      <Input
        label="With Helper Text"
        placeholder="Helper text example"
        value="Needs attention"
        helpText="This needs your attention"
      />
      <Input
        label="Error State"
        placeholder="Error state"
        value="Invalid input"
        error="This field has an error"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ========== ICON ENHANCEMENT STORIES ==========

/**
 * Input with left icon
 */
export const WithLeftIcon: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
    leftIcon: Mail,
  },
};

/**
 * Input with right icon
 */
export const WithRightIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search users...',
    rightIcon: Search,
  },
};

/**
 * Input with both left and right icons
 */
export const WithBothIcons: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    leftIcon: User,
    rightIcon: Check,
  },
};

/**
 * Icon inputs with different sizes
 */
export const IconSizes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Small with Icon"
        placeholder="Small size"
        size="sm"
        leftIcon={Mail}
        rightIcon={Search}
      />
      <Input
        label="Medium with Icon"
        placeholder="Medium size"
        size="md"
        leftIcon={Mail}
        rightIcon={Search}
      />
      <Input
        label="Large with Icon"
        placeholder="Large size"
        size="lg"
        leftIcon={Mail}
        rightIcon={Search}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Icon inputs with different variants
 */
export const IconVariants: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Default with Icons"
        placeholder="Default variant"
        variant="default"
        leftIcon={User}
        rightIcon={Settings}
      />
      <Input
        label="Filled with Icons"
        placeholder="Filled variant"
        variant="filled"
        leftIcon={User}
        rightIcon={Settings}
      />
      <Input
        label="Outlined with Icons"
        placeholder="Outlined variant"
        variant="outlined"
        leftIcon={User}
        rightIcon={Settings}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Icons with state indicators (state indicators take precedence)
 */
export const IconsWithStates: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Success with Right Icon"
        placeholder="Success state"
        leftIcon={Mail}
        rightIcon={Send}
        success={true}
        value="valid@email.com"
        helpText="Right icon is hidden when success state is active"
      />
      <Input
        label="Error with Right Icon"
        placeholder="Error state"
        leftIcon={Lock}
        rightIcon={Eye}
        error="Password is required"
        helpText="Right icon is hidden when error state is active"
      />
      <Input
        label="Left Icon Only with Success"
        placeholder="Left icon remains visible"
        leftIcon={User}
        success={true}
        value="john.doe"
        helpText="Left icons are always visible regardless of state"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Common form field patterns with icons
 */
export const CommonFormPatterns: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        leftIcon={Mail}
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter password"
        leftIcon={Lock}
        required
      />
      <Input
        label="Phone Number"
        type="tel"
        placeholder="(555) 123-4567"
        leftIcon={Phone}
      />
      <Input
        label="Address"
        placeholder="Enter your address"
        leftIcon={MapPin}
      />
      <Input
        label="Date of Birth"
        type="date"
        leftIcon={Calendar}
      />
      <Input
        label="Credit Card"
        placeholder="1234 5678 9012 3456"
        leftIcon={CreditCard}
      />
      <Input
        label="Amount"
        type="number"
        placeholder="0.00"
        leftIcon={DollarSign}
      />
      <Input
        label="Website"
        type="url"
        placeholder="https://example.com"
        leftIcon={Globe}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Search and filter patterns
 */
export const SearchPatterns: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Global Search"
        placeholder="Search everything..."
        leftIcon={Search}
      />
      <Input
        label="Filter Results"
        placeholder="Filter by name..."
        leftIcon={Filter}
        rightIcon={X}
      />
      <Input
        label="User Search"
        placeholder="Find users..."
        leftIcon={User}
        rightIcon={Search}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Action-oriented inputs
 */
export const ActionInputs: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Send Message"
        placeholder="Type your message..."
        rightIcon={Send}
      />
      <Input
        label="Download URL"
        placeholder="Enter download link..."
        leftIcon={Download}
      />
      <Input
        label="Upload Path"
        placeholder="Select file path..."
        leftIcon={Upload}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Custom icon styling
 */
export const CustomIconStyling: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Custom Left Icon Color"
        placeholder="Custom styling"
        leftIcon={Heart}
        leftIconClassName="text-red-500"
      />
      <Input
        label="Custom Right Icon Color"
        placeholder="Custom styling"
        rightIcon={Star}
        rightIconClassName="text-yellow-500"
      />
      <Input
        label="Both Custom Colors"
        placeholder="Both icons styled"
        leftIcon={User}
        rightIcon={Settings}
        leftIconClassName="text-blue-500"
        rightIconClassName="text-green-500"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * JSX Element Icons (alternative to component icons)
 */
export const JSXElementIcons: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Custom SVG Icon"
        placeholder="With custom SVG"
        leftIcon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        }
      />
      <Input
        label="Emoji Icon"
        placeholder="With emoji"
        leftIcon={<span>🔍</span>}
      />
      <Input
        label="Mixed Icon Types"
        placeholder="Component + JSX"
        leftIcon={Mail}
        rightIcon={<span>✨</span>}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

/**
 * Comprehensive icon showcase
 */
export const IconShowcase: Story = {
  render: () => (
    <div className="space-y-8 w-96">
      <div>
        <h3 className="text-lg font-semibold mb-4">Icon Positioning</h3>
        <div className="space-y-4">
          <Input
            label="Left Icon Only"
            placeholder="Left icon only"
            leftIcon={Mail}
          />
          <Input
            label="Right Icon Only"
            placeholder="Right icon only"
            rightIcon={Search}
          />
          <Input
            label="Both Icons"
            placeholder="Both left and right"
            leftIcon={User}
            rightIcon={Settings}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Size Scaling</h3>
        <div className="space-y-4">
          <Input
            label="Small (14px icons)"
            placeholder="Small input"
            size="sm"
            leftIcon={Mail}
            rightIcon={Search}
          />
          <Input
            label="Medium (16px icons)"
            placeholder="Medium input"
            size="md"
            leftIcon={Mail}
            rightIcon={Search}
          />
          <Input
            label="Large (18px icons)"
            placeholder="Large input"
            size="lg"
            leftIcon={Mail}
            rightIcon={Search}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">State Precedence</h3>
        <div className="space-y-4">
          <Input
            label="Success State"
            placeholder="Success overrides right icon"
            leftIcon={Mail}
            rightIcon={Send}
            success={true}
            value="success@example.com"
            helpText="Success indicator takes precedence over right icon"
          />
          <Input
            label="Error State"
            placeholder="Error overrides right icon"
            leftIcon={Lock}
            rightIcon={Eye}
            error="This field is required"
            helpText="Error indicator takes precedence over right icon"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};