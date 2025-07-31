import React from 'react';
import { Input } from '../ui/Input';
import { Search, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export const DynamicPaddingDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-surface-primary">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-primary mb-6">Dynamic Padding Calculation System Demo</h2>
        
        {/* Base padding - no icons */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-primary">Base Padding (No Icons)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Small size" size="sm" />
            <Input placeholder="Medium size" size="md" />
            <Input placeholder="Large size" size="lg" />
          </div>
        </div>

        {/* Left icon only */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-primary">Left Icon Padding</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Small with left icon" size="sm" leftIcon={Search} />
            <Input placeholder="Medium with left icon" size="md" leftIcon={Search} />
            <Input placeholder="Large with left icon" size="lg" leftIcon={Search} />
          </div>
        </div>

        {/* Right icon only */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-primary">Right Icon Padding</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Small with right icon" size="sm" rightIcon={User} />
            <Input placeholder="Medium with right icon" size="md" rightIcon={User} />
            <Input placeholder="Large with right icon" size="lg" rightIcon={User} />
          </div>
        </div>

        {/* Both icons */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-primary">Both Icons Padding</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Small with both icons" size="sm" leftIcon={Mail} rightIcon={Eye} />
            <Input placeholder="Medium with both icons" size="md" leftIcon={Mail} rightIcon={Eye} />
            <Input placeholder="Large with both icons" size="lg" leftIcon={Mail} rightIcon={Eye} />
          </div>
        </div>

        {/* State indicator precedence */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-primary">State Indicator Precedence</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                placeholder="Success with right icon" 
                rightIcon={User} 
                success={true}
                helpText="State indicator takes precedence over right icon"
              />
              <Input 
                placeholder="Error with right icon" 
                rightIcon={User} 
                error="State indicator takes precedence"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                placeholder="Left icon + success state" 
                leftIcon={Lock} 
                success={true}
                helpText="Left icon + success state indicator"
              />
              <Input 
                placeholder="Left icon + error state" 
                leftIcon={Lock} 
                error="Left icon + error state indicator"
              />
            </div>
          </div>
        </div>

        {/* Complex combinations */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-primary">Complex Combinations</h3>
          <div className="space-y-4">
            <Input 
              placeholder="All combinations: left + right + error" 
              leftIcon={Search} 
              rightIcon={EyeOff} 
              error="Error state overrides right icon"
              helpText="Left icon visible, error state takes precedence over right icon"
            />
            <Input 
              placeholder="All combinations: left + right + success" 
              leftIcon={Mail} 
              rightIcon={User} 
              success={true}
              helpText="Left icon visible, success state takes precedence over right icon"
            />
          </div>
        </div>

        {/* Visual comparison */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-primary">Visual Padding Comparison</h3>
          <div className="space-y-2">
            <Input placeholder="No icons - base padding" />
            <Input placeholder="Left icon - increased left padding" leftIcon={Search} />
            <Input placeholder="Right icon - increased right padding" rightIcon={User} />
            <Input placeholder="Both icons - increased both paddings" leftIcon={Search} rightIcon={User} />
          </div>
        </div>

        {/* Icon position constants demonstration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Icon Position Constants</h3>
          <div className="space-y-2">
            <div className="text-sm text-tertiary mb-2">
              Icons are positioned using size-specific constants:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Small: left-2.5, right-2.5 (10px from edge)</li>
                <li>Medium: left-3, right-3 (12px from edge)</li>
                <li>Large: left-4, right-4 (16px from edge)</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input placeholder="SM: 10px spacing" size="sm" leftIcon={Search} rightIcon={User} />
              <Input placeholder="MD: 12px spacing" size="md" leftIcon={Search} rightIcon={User} />
              <Input placeholder="LG: 16px spacing" size="lg" leftIcon={Search} rightIcon={User} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};