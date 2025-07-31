import React from 'react';
import { Input } from '../ui/Input';
import { Search, User, Mail, Lock, Eye, EyeOff, Calendar, MapPin } from 'lucide-react';

export const ResponsiveIconDemo: React.FC = () => {
  const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
  const variants: Array<'default' | 'filled' | 'outlined'> = ['default', 'filled', 'outlined'];

  return (
    <div className="p-8 space-y-8 bg-surface-primary">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-6">
          Responsive Icon Sizing and Positioning Demo
        </h1>
        
        {/* Size Demonstration */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">
            Icon Size Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-secondary">Small (14px)</h3>
              <Input
                size="sm"
                placeholder="Small input with icons"
                leftIcon={Search}
                rightIcon={User}
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-secondary">Medium (16px)</h3>
              <Input
                size="md"
                placeholder="Medium input with icons"
                leftIcon={Search}
                rightIcon={User}
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-secondary">Large (18px)</h3>
              <Input
                size="lg"
                placeholder="Large input with icons"
                leftIcon={Search}
                rightIcon={User}
              />
            </div>
          </div>
        </section>

        {/* Variant and Size Combinations */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">
            All Size and Variant Combinations
          </h2>
          <div className="space-y-6">
            {variants.map(variant => (
              <div key={variant} className="space-y-3">
                <h3 className="text-lg font-medium text-secondary capitalize">
                  {variant} Variant
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sizes.map(size => (
                    <div key={`${variant}-${size}`} className="space-y-2">
                      <h4 className="text-sm font-medium text-tertiary">
                        {size.toUpperCase()} Size
                      </h4>
                      <Input
                        variant={variant}
                        size={size}
                        placeholder={`${variant} ${size}`}
                        leftIcon={Mail}
                        rightIcon={Lock}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Left Icon Only */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">
            Left Icon Only - All Combinations
          </h2>
          <div className="space-y-4">
            {variants.map(variant => (
              <div key={`left-${variant}`} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sizes.map(size => (
                  <Input
                    key={`left-${variant}-${size}`}
                    variant={variant}
                    size={size}
                    placeholder={`Left icon - ${variant} ${size}`}
                    leftIcon={Search}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Right Icon Only */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">
            Right Icon Only - All Combinations
          </h2>
          <div className="space-y-4">
            {variants.map(variant => (
              <div key={`right-${variant}`} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sizes.map(size => (
                  <Input
                    key={`right-${variant}-${size}`}
                    variant={variant}
                    size={size}
                    placeholder={`Right icon - ${variant} ${size}`}
                    rightIcon={User}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* State Indicators with Icons */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">
            State Indicators with Icons (State Takes Precedence)
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                size="sm"
                variant="default"
                placeholder="Success with right icon"
                leftIcon={Mail}
                rightIcon={User} // This should be hidden
                success={true}
              />
              <Input
                size="md"
                variant="filled"
                placeholder="Error with right icon"
                leftIcon={Mail}
                rightIcon={User} // This should be hidden
                error="This is an error"
              />
              <Input
                size="lg"
                variant="outlined"
                placeholder="Success with right icon"
                leftIcon={Mail}
                rightIcon={User} // This should be hidden
                success={true}
              />
            </div>
          </div>
        </section>

        {/* JSX Element Icons */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">
            JSX Element Icons - Responsive Sizing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              size="sm"
              placeholder="Custom JSX icon"
              leftIcon={
                <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                  C
                </div>
              }
            />
            <Input
              size="md"
              placeholder="Custom JSX icon"
              leftIcon={
                <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  M
                </div>
              }
            />
            <Input
              size="lg"
              placeholder="Custom JSX icon"
              leftIcon={
                <div className="w-full h-full bg-purple-500 rounded-full flex items-center justify-center text-white text-base">
                  L
                </div>
              }
            />
          </div>
        </section>

        {/* Different Icon Types */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">
            Various Icon Types - Medium Size
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              size="md"
              variant="default"
              placeholder="Search functionality"
              leftIcon={Search}
              rightIcon={Eye}
            />
            <Input
              size="md"
              variant="filled"
              placeholder="Email input"
              leftIcon={Mail}
              rightIcon={EyeOff}
            />
            <Input
              size="md"
              variant="outlined"
              placeholder="Date picker"
              leftIcon={Calendar}
              rightIcon={MapPin}
            />
            <Input
              size="md"
              variant="default"
              placeholder="Password field"
              type="password"
              leftIcon={Lock}
              rightIcon={Eye}
            />
          </div>
        </section>

        {/* Focus States */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">
            Focus States with Icons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              size="sm"
              variant="outlined"
              placeholder="Focus me (small)"
              leftIcon={Search}
              rightIcon={User}
              autoFocus
            />
            <Input
              size="md"
              variant="default"
              placeholder="Focus me (medium)"
              leftIcon={Mail}
              rightIcon={Lock}
            />
            <Input
              size="lg"
              variant="filled"
              placeholder="Focus me (large)"
              leftIcon={Calendar}
              rightIcon={MapPin}
            />
          </div>
        </section>

        {/* Measurement Reference */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">
            Icon Size Reference
          </h2>
          <div className="flex items-center space-x-8 p-4 bg-surface-secondary rounded-lg">
            <div className="flex items-center space-x-2">
              <Search size={14} className="text-primary" />
              <span className="text-sm text-secondary">14px (Small)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Search size={16} className="text-primary" />
              <span className="text-sm text-secondary">16px (Medium)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Search size={18} className="text-primary" />
              <span className="text-sm text-secondary">18px (Large)</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};