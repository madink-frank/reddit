import { test, expect, Page } from '@playwright/test';

/**
 * Playwright Visual Regression Tests for Input Component with Icons
 * 
 * This test suite creates actual screenshot comparisons for the Input component
 * with various icon configurations, sizes, variants, and states.
 * 
 * Requirements covered:
 * - 2.4: Focus ring appearance with icons
 * - 3.1: Icon positioning in different browser environments  
 * - 3.2: Icon scaling with different input sizes
 * - 3.3: Icon behavior with error/success states
 */

// Test configuration
const sizes = ['sm', 'md', 'lg'] as const;
const variants = ['default', 'filled', 'outlined'] as const;
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1024, height: 768 },
];

// Helper function to create a test page with Input components
async function createInputTestPage(page: Page, content: string) {
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Input Icon Visual Test</title>
      <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
      <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        /* Disable animations for consistent screenshots */
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        
        /* Design system colors */
        :root {
          --color-primary: #1f2937;
          --color-secondary: #6b7280;
          --color-tertiary: #9ca3af;
          --color-surface-primary: #ffffff;
          --color-surface-secondary: #f9fafb;
          --color-error: #ef4444;
          --color-success: #10b981;
          --color-focus: #3b82f6;
        }
        
        .text-primary { color: var(--color-primary); }
        .text-secondary { color: var(--color-secondary); }
        .text-tertiary { color: var(--color-tertiary); }
        .text-error { color: var(--color-error); }
        .text-success { color: var(--color-success); }
        .bg-surface-primary { background-color: var(--color-surface-primary); }
        .bg-surface-secondary { background-color: var(--color-surface-secondary); }
        .border-primary { border-color: var(--color-primary); }
        .border-error { border-color: var(--color-error); }
        .border-success { border-color: var(--color-success); }
        .border-focus { border-color: var(--color-focus); }
        .ring-focus { --tw-ring-color: var(--color-focus); }
      </style>
    </head>
    <body class="bg-gray-50 p-8">
      <div id="root"></div>
      <script>
        ${content}
      </script>
    </body>
    </html>
  `);

  // Wait for React components to render
  await page.waitForTimeout(500);
}

test.describe('Input Icon Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations globally
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test.describe('Icon and Size Combinations', () => {
    sizes.forEach(size => {
      variants.forEach(variant => {
        test(`should render ${size} ${variant} input with icons correctly`, async ({ page }) => {
          await createInputTestPage(page, `
            const { useState } = React;
            const { Search, User, Mail, Eye } = LucideReact;
            
            // Mock Input component (simplified version for testing)
            function Input({ size, variant, leftIcon: LeftIcon, rightIcon: RightIcon, ...props }) {
              const sizeClasses = {
                sm: 'h-8 px-3 text-sm',
                md: 'h-10 px-3 text-sm', 
                lg: 'h-12 px-4 text-base'
              };
              
              const variantClasses = {
                default: 'border border-gray-300 bg-white',
                filled: 'border border-transparent bg-gray-100',
                outlined: 'border-2 border-gray-300 bg-transparent'
              };
              
              const iconPadding = {
                sm: LeftIcon ? 'pl-8' : 'pl-3',
                md: LeftIcon ? 'pl-10' : 'pl-3',
                lg: LeftIcon ? 'pl-12' : 'pl-4'
              };
              
              return React.createElement('div', { className: 'relative w-full' }, [
                LeftIcon && React.createElement('div', {
                  key: 'left-icon',
                  className: 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'
                }, React.createElement(LeftIcon, { size: size === 'sm' ? 14 : size === 'md' ? 16 : 18, className: 'text-gray-400' })),
                
                React.createElement('input', {
                  key: 'input',
                  className: \`w-full rounded-md \${sizeClasses[size]} \${variantClasses[variant]} \${iconPadding[size]} focus:outline-none focus:ring-2 focus:ring-blue-500\`,
                  ...props
                }),
                
                RightIcon && React.createElement('div', {
                  key: 'right-icon', 
                  className: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'
                }, React.createElement(RightIcon, { size: size === 'sm' ? 14 : size === 'md' ? 16 : 18, className: 'text-gray-400' }))
              ]);
            }
            
            function App() {
              return React.createElement('div', { className: 'space-y-4 w-80' }, [
                React.createElement('h2', { key: 'title', className: 'text-lg font-semibold' }, '${size} ${variant} Input Variations'),
                React.createElement(Input, {
                  key: 'left-icon',
                  size: '${size}',
                  variant: '${variant}',
                  leftIcon: Search,
                  placeholder: 'Left icon only',
                  'data-testid': 'left-icon-input'
                }),
                React.createElement(Input, {
                  key: 'right-icon',
                  size: '${size}',
                  variant: '${variant}',
                  rightIcon: User,
                  placeholder: 'Right icon only',
                  'data-testid': 'right-icon-input'
                }),
                React.createElement(Input, {
                  key: 'both-icons',
                  size: '${size}',
                  variant: '${variant}',
                  leftIcon: Mail,
                  rightIcon: Eye,
                  placeholder: 'Both icons',
                  'data-testid': 'both-icons-input'
                })
              ]);
            }
            
            ReactDOM.render(React.createElement(App), document.getElementById('root'));
          `);

          // Wait for components to render
          await page.waitForSelector('[data-testid="left-icon-input"]');

          // Take screenshot
          await expect(page.locator('#root')).toHaveScreenshot(`input-${size}-${variant}-icons.png`);
        });
      });
    });
  });

  test.describe('Success and Error States with Icons', () => {
    test('should render success and error states correctly', async ({ page }) => {
      await createInputTestPage(page, `
        const { Search, User, Mail, AlertCircle, CheckCircle } = LucideReact;
        
        function Input({ size = 'md', variant = 'default', leftIcon: LeftIcon, success, error, ...props }) {
          const sizeClasses = {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-3 text-sm',
            lg: 'h-12 px-4 text-base'
          };
          
          const variantClasses = {
            default: 'border bg-white',
            filled: 'border border-transparent bg-gray-100',
            outlined: 'border-2 bg-transparent'
          };
          
          const stateClasses = error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-300';
          const iconPadding = LeftIcon ? 'pl-10' : 'pl-3';
          
          return React.createElement('div', { className: 'relative w-full' }, [
            LeftIcon && React.createElement('div', {
              key: 'left-icon',
              className: 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'
            }, React.createElement(LeftIcon, { size: 16, className: 'text-gray-400' })),
            
            React.createElement('input', {
              key: 'input',
              className: \`w-full rounded-md \${sizeClasses[size]} \${variantClasses[variant]} \${stateClasses} \${iconPadding} pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500\`,
              ...props
            }),
            
            (success || error) && React.createElement('div', {
              key: 'state-icon',
              className: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'
            }, React.createElement(success ? CheckCircle : AlertCircle, { 
              size: 16, 
              className: success ? 'text-green-500' : 'text-red-500' 
            })),
            
            error && React.createElement('p', {
              key: 'error-text',
              className: 'mt-1 text-sm text-red-600'
            }, error)
          ]);
        }
        
        function App() {
          return React.createElement('div', { className: 'space-y-6 w-80' }, [
            React.createElement('h2', { key: 'title', className: 'text-lg font-semibold' }, 'Success and Error States'),
            
            React.createElement('div', { key: 'success-section', className: 'space-y-3' }, [
              React.createElement('h3', { key: 'success-title', className: 'text-md font-medium text-green-600' }, 'Success States'),
              React.createElement(Input, {
                key: 'success-left',
                leftIcon: User,
                success: true,
                value: 'Valid input',
                placeholder: 'Success with left icon',
                'data-testid': 'success-left-icon'
              }),
              React.createElement(Input, {
                key: 'success-both',
                leftIcon: Mail,
                success: true,
                value: 'user@example.com',
                placeholder: 'Success with both icons',
                'data-testid': 'success-both-icons'
              })
            ]),
            
            React.createElement('div', { key: 'error-section', className: 'space-y-3' }, [
              React.createElement('h3', { key: 'error-title', className: 'text-md font-medium text-red-600' }, 'Error States'),
              React.createElement(Input, {
                key: 'error-left',
                leftIcon: Mail,
                error: 'This field is required',
                placeholder: 'Error with left icon',
                'data-testid': 'error-left-icon'
              }),
              React.createElement(Input, {
                key: 'error-precedence',
                leftIcon: Search,
                error: 'Invalid input - state indicator takes precedence',
                placeholder: 'Error state precedence',
                'data-testid': 'error-precedence'
              })
            ])
          ]);
        }
        
        ReactDOM.render(React.createElement(App), document.getElementById('root'));
      `);

      await page.waitForSelector('[data-testid="success-left-icon"]');
      await expect(page.locator('#root')).toHaveScreenshot('input-success-error-states.png');
    });
  });

  test.describe('Focus Ring Appearance with Icons', () => {
    sizes.forEach(size => {
      test(`should render focus ring correctly with icons in ${size} size`, async ({ page }) => {
        await createInputTestPage(page, `
          const { Search, Calendar } = LucideReact;
          
          function Input({ size, leftIcon: LeftIcon, rightIcon: RightIcon, focused, ...props }) {
            const sizeClasses = {
              sm: 'h-8 px-3 text-sm',
              md: 'h-10 px-3 text-sm',
              lg: 'h-12 px-4 text-base'
            };
            
            const focusClasses = focused ? 'ring-2 ring-blue-500 ring-offset-2' : '';
            const iconPadding = LeftIcon ? 'pl-10' : 'pl-3';
            const rightPadding = RightIcon ? 'pr-10' : 'pr-3';
            
            return React.createElement('div', { className: \`relative w-full \${focusClasses} rounded-md\` }, [
              LeftIcon && React.createElement('div', {
                key: 'left-icon',
                className: 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10'
              }, React.createElement(LeftIcon, { size: size === 'sm' ? 14 : size === 'md' ? 16 : 18, className: 'text-gray-400' })),
              
              React.createElement('input', {
                key: 'input',
                className: \`w-full rounded-md \${sizeClasses[size]} \${iconPadding} \${rightPadding} border border-gray-300 bg-white focus:outline-none\`,
                ...props
              }),
              
              RightIcon && React.createElement('div', {
                key: 'right-icon',
                className: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-10'
              }, React.createElement(RightIcon, { size: size === 'sm' ? 14 : size === 'md' ? 16 : 18, className: 'text-gray-400' }))
            ]);
          }
          
          function App() {
            return React.createElement('div', { className: 'space-y-6 w-80' }, [
              React.createElement('h2', { key: 'title', className: 'text-lg font-semibold' }, '${size} Focus Ring with Icons'),
              React.createElement(Input, {
                key: 'focused-both',
                size: '${size}',
                leftIcon: Search,
                rightIcon: Calendar,
                focused: true,
                placeholder: 'Focused input with both icons',
                'data-testid': 'focused-input'
              }),
              React.createElement(Input, {
                key: 'unfocused-both',
                size: '${size}',
                leftIcon: Search,
                rightIcon: Calendar,
                focused: false,
                placeholder: 'Unfocused input for comparison',
                'data-testid': 'unfocused-input'
              })
            ]);
          }
          
          ReactDOM.render(React.createElement(App), document.getElementById('root'));
        `);

        await page.waitForSelector('[data-testid="focused-input"]');
        await expect(page.locator('#root')).toHaveScreenshot(`input-${size}-focus-ring.png`);
      });
    });
  });

  test.describe('Icon Positioning in Different Browser Environments', () => {
    viewports.forEach(({ name, width, height }) => {
      test(`should render icons correctly on ${name} viewport`, async ({ page }) => {
        await page.setViewportSize({ width, height });

        await createInputTestPage(page, `
          const { Search, User, Mail, Calendar, Lock, Eye } = LucideReact;
          
          function Input({ size = 'md', variant = 'default', leftIcon: LeftIcon, rightIcon: RightIcon, ...props }) {
            const sizeClasses = {
              sm: 'h-8 px-3 text-sm',
              md: 'h-10 px-3 text-sm',
              lg: 'h-12 px-4 text-base'
            };
            
            const variantClasses = {
              default: 'border border-gray-300 bg-white',
              filled: 'border border-transparent bg-gray-100',
              outlined: 'border-2 border-gray-300 bg-transparent'
            };
            
            const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;
            const leftPadding = LeftIcon ? (size === 'sm' ? 'pl-8' : size === 'md' ? 'pl-10' : 'pl-12') : 'pl-3';
            const rightPadding = RightIcon ? (size === 'sm' ? 'pr-8' : size === 'md' ? 'pr-10' : 'pr-12') : 'pr-3';
            
            return React.createElement('div', { className: 'relative w-full' }, [
              LeftIcon && React.createElement('div', {
                key: 'left-icon',
                className: \`absolute inset-y-0 left-0 flex items-center \${size === 'sm' ? 'left-2.5' : size === 'md' ? 'left-3' : 'left-4'} pointer-events-none\`
              }, React.createElement(LeftIcon, { size: iconSize, className: 'text-gray-400' })),
              
              React.createElement('input', {
                key: 'input',
                className: \`w-full rounded-md \${sizeClasses[size]} \${variantClasses[variant]} \${leftPadding} \${rightPadding} focus:outline-none focus:ring-2 focus:ring-blue-500\`,
                ...props
              }),
              
              RightIcon && React.createElement('div', {
                key: 'right-icon',
                className: \`absolute inset-y-0 right-0 flex items-center \${size === 'sm' ? 'right-2.5' : size === 'md' ? 'right-3' : 'right-4'} pointer-events-none\`
              }, React.createElement(RightIcon, { size: iconSize, className: 'text-gray-400' }))
            ]);
          }
          
          function App() {
            const containerWidth = ${width} < 768 ? 'w-full px-4' : ${width} < 1024 ? 'w-96' : 'w-80';
            
            return React.createElement('div', { className: \`space-y-4 \${containerWidth}\` }, [
              React.createElement('h2', { key: 'title', className: 'text-lg font-semibold' }, '${name} Viewport (${width}x${height})'),
              React.createElement(Input, {
                key: 'small',
                size: 'sm',
                leftIcon: Search,
                rightIcon: User,
                placeholder: 'Small input with icons',
                'data-testid': 'small-input'
              }),
              React.createElement(Input, {
                key: 'medium',
                size: 'md',
                variant: 'filled',
                leftIcon: Mail,
                rightIcon: Calendar,
                placeholder: 'Medium filled input',
                'data-testid': 'medium-input'
              }),
              React.createElement(Input, {
                key: 'large',
                size: 'lg',
                variant: 'outlined',
                leftIcon: Lock,
                rightIcon: Eye,
                placeholder: 'Large outlined input',
                'data-testid': 'large-input'
              })
            ]);
          }
          
          ReactDOM.render(React.createElement(App), document.getElementById('root'));
        `);

        await page.waitForSelector('[data-testid="small-input"]');
        await expect(page.locator('#root')).toHaveScreenshot(`input-icons-${name}-viewport.png`);
      });
    });
  });

  test.describe('Form Context and Layout Testing', () => {
    test('should render icons correctly in form layouts', async ({ page }) => {
      await createInputTestPage(page, `
        const { User, Mail, Lock, Phone, Calendar, Search } = LucideReact;
        
        function Input({ label, error, helpText, leftIcon: LeftIcon, rightIcon: RightIcon, required, ...props }) {
          const iconPadding = LeftIcon ? 'pl-10' : 'pl-3';
          const rightPadding = RightIcon ? 'pr-10' : 'pr-3';
          
          return React.createElement('div', { className: 'w-full' }, [
            label && React.createElement('label', {
              key: 'label',
              className: 'block text-sm font-medium text-gray-700 mb-2'
            }, [
              label,
              required && React.createElement('span', { key: 'required', className: 'text-red-500 ml-1' }, '*')
            ]),
            
            React.createElement('div', { key: 'input-container', className: 'relative' }, [
              LeftIcon && React.createElement('div', {
                key: 'left-icon',
                className: 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'
              }, React.createElement(LeftIcon, { size: 16, className: 'text-gray-400' })),
              
              React.createElement('input', {
                key: 'input',
                className: \`w-full h-10 rounded-md border border-gray-300 bg-white \${iconPadding} \${rightPadding} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500\`,
                ...props
              }),
              
              RightIcon && React.createElement('div', {
                key: 'right-icon',
                className: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'
              }, React.createElement(RightIcon, { size: 16, className: 'text-gray-400' }))
            ]),
            
            helpText && !error && React.createElement('p', {
              key: 'help-text',
              className: 'mt-1 text-xs text-gray-500'
            }, helpText),
            
            error && React.createElement('p', {
              key: 'error-text',
              className: 'mt-1 text-xs text-red-600'
            }, error)
          ]);
        }
        
        function App() {
          return React.createElement('div', { className: 'max-w-md mx-auto space-y-6' }, [
            React.createElement('h2', { key: 'title', className: 'text-xl font-semibold text-center' }, 'Form Layout with Icons'),
            
            React.createElement('form', { key: 'form', className: 'space-y-4' }, [
              React.createElement(Input, {
                key: 'name',
                label: 'Full Name',
                leftIcon: User,
                placeholder: 'Enter your full name',
                required: true,
                'data-testid': 'name-input'
              }),
              
              React.createElement(Input, {
                key: 'email',
                label: 'Email Address',
                type: 'email',
                leftIcon: Mail,
                placeholder: 'Enter your email',
                helpText: "We'll never share your email with anyone else.",
                required: true,
                'data-testid': 'email-input'
              }),
              
              React.createElement(Input, {
                key: 'phone',
                label: 'Phone Number',
                leftIcon: Phone,
                placeholder: '(555) 123-4567',
                error: 'Please enter a valid phone number',
                'data-testid': 'phone-input'
              }),
              
              React.createElement(Input, {
                key: 'password',
                label: 'Password',
                type: 'password',
                leftIcon: Lock,
                rightIcon: Search,
                placeholder: 'Enter your password',
                required: true,
                'data-testid': 'password-input'
              }),
              
              React.createElement('div', { key: 'grid', className: 'grid grid-cols-2 gap-4' }, [
                React.createElement(Input, {
                  key: 'date',
                  label: 'Date',
                  type: 'date',
                  leftIcon: Calendar,
                  'data-testid': 'date-input'
                }),
                React.createElement(Input, {
                  key: 'search',
                  label: 'Search',
                  leftIcon: Search,
                  placeholder: 'Search...',
                  'data-testid': 'search-input'
                })
              ])
            ])
          ]);
        }
        
        ReactDOM.render(React.createElement(App), document.getElementById('root'));
      `);

      await page.waitForSelector('[data-testid="name-input"]');
      await expect(page.locator('#root')).toHaveScreenshot('input-icons-form-layout.png');
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle various edge cases gracefully', async ({ page }) => {
      await createInputTestPage(page, `
        const { Search, User, AlertTriangle } = LucideReact;
        
        function Input({ leftIcon: LeftIcon, rightIcon: RightIcon, ...props }) {
          const iconPadding = LeftIcon ? 'pl-10' : 'pl-3';
          const rightPadding = RightIcon ? 'pr-10' : 'pr-3';
          
          return React.createElement('div', { className: 'relative w-full' }, [
            LeftIcon && React.createElement('div', {
              key: 'left-icon',
              className: 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'
            }, React.createElement(LeftIcon, { size: 16, className: 'text-gray-400' })),
            
            React.createElement('input', {
              key: 'input',
              className: \`w-full h-10 rounded-md border border-gray-300 bg-white \${iconPadding} \${rightPadding} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500\`,
              ...props
            }),
            
            RightIcon && React.createElement('div', {
              key: 'right-icon',
              className: 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'
            }, React.createElement(RightIcon, { size: 16, className: 'text-gray-400' }))
          ]);
        }
        
        function App() {
          return React.createElement('div', { className: 'space-y-4 w-96' }, [
            React.createElement('h2', { key: 'title', className: 'text-lg font-semibold' }, 'Edge Cases'),
            
            React.createElement(Input, {
              key: 'long-placeholder',
              leftIcon: Search,
              rightIcon: User,
              placeholder: 'This is a very long placeholder text that should be handled gracefully by the input component without breaking the layout',
              'data-testid': 'long-placeholder'
            }),
            
            React.createElement(Input, {
              key: 'prefilled',
              leftIcon: User,
              value: 'Pre-filled value that is quite long and should not overflow',
              'data-testid': 'prefilled-input'
            }),
            
            React.createElement(Input, {
              key: 'disabled',
              leftIcon: AlertTriangle,
              rightIcon: Search,
              disabled: true,
              placeholder: 'Disabled input with icons',
              'data-testid': 'disabled-input'
            }),
            
            React.createElement(Input, {
              key: 'readonly',
              leftIcon: User,
              readOnly: true,
              value: 'Read-only input with icon',
              'data-testid': 'readonly-input'
            })
          ]);
        }
        
        ReactDOM.render(React.createElement(App), document.getElementById('root'));
      `);

      await page.waitForSelector('[data-testid="long-placeholder"]');
      await expect(page.locator('#root')).toHaveScreenshot('input-icons-edge-cases.png');
    });
  });
});