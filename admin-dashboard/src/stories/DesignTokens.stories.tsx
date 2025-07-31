import type { Meta, StoryObj } from '@storybook/react';

/**
 * Design Tokens documentation showcasing the design system's foundational elements.
 * These tokens ensure consistency across all components and layouts.
 */
const meta: Meta = {
  title: 'Design System/Design Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Design Tokens

Design tokens are the foundational elements of our design system. They define colors, typography, spacing, and other visual properties that ensure consistency across the entire application.

## Token Categories

- **Colors**: Primary, secondary, semantic colors, and neutral grays
- **Typography**: Font families, sizes, weights, and line heights
- **Spacing**: Consistent spacing scale for margins, padding, and gaps
- **Border Radius**: Consistent corner radius values
- **Shadows**: Elevation and depth through shadow tokens
- **Breakpoints**: Responsive design breakpoints

## Usage

All design tokens are defined as CSS custom properties and can be used throughout the application:

\`\`\`css
.my-component {
  color: var(--color-primary);
  font-size: var(--text-base);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Color palette showing all available colors in the design system
 */
export const Colors: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Color Palette</h2>
        
        {/* Primary Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Primary Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[50, 100, 500, 600, 700].map((shade) => (
              <div key={shade} className="text-center">
                <div 
                  className={`w-20 h-20 rounded-lg mb-2 mx-auto`}
                  style={{ backgroundColor: `var(--color-primary-${shade})` }}
                />
                <div className="text-sm font-medium">Primary {shade}</div>
                <div className="text-xs text-gray-500">--color-primary-{shade}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Success', var: '--color-success', bg: 'bg-success' },
              { name: 'Warning', var: '--color-warning', bg: 'bg-warning' },
              { name: 'Error', var: '--color-error', bg: 'bg-error' },
              { name: 'Info', var: '--color-info', bg: 'bg-info' },
            ].map((color) => (
              <div key={color.name} className="text-center">
                <div 
                  className={`w-20 h-20 rounded-lg mb-2 mx-auto ${color.bg}`}
                />
                <div className="text-sm font-medium">{color.name}</div>
                <div className="text-xs text-gray-500">{color.var}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Neutral Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Neutral Colors</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[50, 100, 200, 500, 800, 900].map((shade) => (
              <div key={shade} className="text-center">
                <div 
                  className={`w-20 h-20 rounded-lg mb-2 mx-auto`}
                  style={{ backgroundColor: `var(--color-gray-${shade})` }}
                />
                <div className="text-sm font-medium">Gray {shade}</div>
                <div className="text-xs text-gray-500">--color-gray-{shade}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Typography scale showing all available text sizes and styles
 */
export const Typography: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Typography</h2>
        
        {/* Font Families */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Font Families</h3>
          <div className="space-y-4">
            <div>
              <div className="text-2xl" style={{ fontFamily: 'var(--font-sans)' }}>
                Sans Serif Font (Inter)
              </div>
              <div className="text-sm text-gray-500">--font-sans</div>
            </div>
            <div>
              <div className="text-2xl" style={{ fontFamily: 'var(--font-mono)' }}>
                Monospace Font (JetBrains Mono)
              </div>
              <div className="text-sm text-gray-500">--font-mono</div>
            </div>
          </div>
        </div>

        {/* Font Sizes */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Font Sizes</h3>
          <div className="space-y-4">
            {[
              { name: 'Extra Small', class: 'text-xs', var: '--text-xs', size: '0.75rem' },
              { name: 'Small', class: 'text-sm', var: '--text-sm', size: '0.875rem' },
              { name: 'Base', class: 'text-base', var: '--text-base', size: '1rem' },
              { name: 'Large', class: 'text-lg', var: '--text-lg', size: '1.125rem' },
              { name: 'Extra Large', class: 'text-xl', var: '--text-xl', size: '1.25rem' },
              { name: '2X Large', class: 'text-2xl', var: '--text-2xl', size: '1.5rem' },
              { name: '3X Large', class: 'text-3xl', var: '--text-3xl', size: '1.875rem' },
            ].map((size) => (
              <div key={size.name} className="flex items-center gap-4">
                <div className={`${size.class} font-medium min-w-0 flex-1`}>
                  The quick brown fox jumps over the lazy dog
                </div>
                <div className="text-sm text-gray-500 min-w-fit">
                  {size.name} ({size.size}) - {size.var}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Font Weights */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Font Weights</h3>
          <div className="space-y-4">
            {[
              { name: 'Normal', class: 'font-normal', weight: '400' },
              { name: 'Medium', class: 'font-medium', weight: '500' },
              { name: 'Semibold', class: 'font-semibold', weight: '600' },
              { name: 'Bold', class: 'font-bold', weight: '700' },
            ].map((weight) => (
              <div key={weight.name} className="flex items-center gap-4">
                <div className={`text-lg ${weight.class} min-w-0 flex-1`}>
                  The quick brown fox jumps over the lazy dog
                </div>
                <div className="text-sm text-gray-500 min-w-fit">
                  {weight.name} ({weight.weight})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Spacing scale showing all available spacing values
 */
export const Spacing: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Spacing Scale</h2>
        
        <div className="space-y-6">
          {[
            { name: 'Space 1', var: '--space-1', value: '0.25rem', px: '4px' },
            { name: 'Space 2', var: '--space-2', value: '0.5rem', px: '8px' },
            { name: 'Space 3', var: '--space-3', value: '0.75rem', px: '12px' },
            { name: 'Space 4', var: '--space-4', value: '1rem', px: '16px' },
            { name: 'Space 6', var: '--space-6', value: '1.5rem', px: '24px' },
            { name: 'Space 8', var: '--space-8', value: '2rem', px: '32px' },
            { name: 'Space 12', var: '--space-12', value: '3rem', px: '48px' },
            { name: 'Space 16', var: '--space-16', value: '4rem', px: '64px' },
          ].map((space) => (
            <div key={space.name} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium">{space.name}</div>
              <div 
                className="bg-blue-500 h-4"
                style={{ width: space.value }}
              />
              <div className="text-sm text-gray-500">
                {space.value} ({space.px}) - {space.var}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * Border radius values showing all available corner radius options
 */
export const BorderRadius: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Border Radius</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: 'None', class: 'rounded-none', var: '--radius-none', value: '0' },
            { name: 'Small', class: 'rounded-sm', var: '--radius-sm', value: '0.125rem' },
            { name: 'Medium', class: 'rounded-md', var: '--radius-md', value: '0.375rem' },
            { name: 'Large', class: 'rounded-lg', var: '--radius-lg', value: '0.5rem' },
            { name: 'Extra Large', class: 'rounded-xl', var: '--radius-xl', value: '0.75rem' },
            { name: '2X Large', class: 'rounded-2xl', var: '--radius-2xl', value: '1rem' },
            { name: 'Full', class: 'rounded-full', var: '--radius-full', value: '9999px' },
          ].map((radius) => (
            <div key={radius.name} className="text-center">
              <div 
                className={`w-20 h-20 bg-blue-500 mb-2 mx-auto ${radius.class}`}
              />
              <div className="text-sm font-medium">{radius.name}</div>
              <div className="text-xs text-gray-500">{radius.value}</div>
              <div className="text-xs text-gray-400">{radius.var}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * Shadow tokens showing elevation levels
 */
export const Shadows: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Shadows</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Small', class: 'shadow-sm', var: '--shadow-sm' },
            { name: 'Medium', class: 'shadow-md', var: '--shadow-md' },
            { name: 'Large', class: 'shadow-lg', var: '--shadow-lg' },
            { name: 'Extra Large', class: 'shadow-xl', var: '--shadow-xl' },
            { name: '2X Large', class: 'shadow-2xl', var: '--shadow-2xl' },
          ].map((shadow) => (
            <div key={shadow.name} className="text-center">
              <div 
                className={`w-24 h-24 bg-white rounded-lg mb-4 mx-auto ${shadow.class}`}
              />
              <div className="text-sm font-medium">{shadow.name}</div>
              <div className="text-xs text-gray-500">{shadow.var}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * Responsive breakpoints documentation
 */
export const Breakpoints: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Responsive Breakpoints</h2>
        
        <div className="space-y-4">
          {[
            { name: 'Small (sm)', value: '640px', description: 'Mobile landscape and small tablets' },
            { name: 'Medium (md)', value: '768px', description: 'Tablets' },
            { name: 'Large (lg)', value: '1024px', description: 'Small desktops' },
            { name: 'Extra Large (xl)', value: '1280px', description: 'Large desktops' },
            { name: '2X Large (2xl)', value: '1536px', description: 'Extra large screens' },
          ].map((breakpoint) => (
            <div key={breakpoint.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{breakpoint.name}</div>
                <div className="text-sm text-gray-500">{breakpoint.value}</div>
              </div>
              <div className="text-sm text-gray-600">{breakpoint.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};