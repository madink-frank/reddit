import React from 'react';
import { Input } from '../ui/Input';

// Mock icons for demonstration
const SearchIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    className={className}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const UserIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    className={className}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EyeIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    className={className}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// JSX element icon
const HeartIcon = (
  <svg 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
    />
  </svg>
);

export const IconInputDemo: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-md">
      <h2 className="text-xl font-semibold mb-4">Icon Input Demo</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Left Icon (Component)</h3>
          <Input 
            leftIcon={SearchIcon}
            placeholder="Search..."
            label="Search Input"
          />
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Right Icon (Component)</h3>
          <Input 
            rightIcon={UserIcon}
            placeholder="Username"
            label="User Input"
          />
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Both Icons</h3>
          <Input 
            leftIcon={SearchIcon}
            rightIcon={UserIcon}
            placeholder="Search users..."
            label="Search Users"
          />
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">JSX Element Icon</h3>
          <Input 
            leftIcon={HeartIcon}
            placeholder="Favorite item"
            label="Favorites"
          />
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Different Sizes</h3>
          <div className="space-y-2">
            <Input 
              leftIcon={SearchIcon}
              placeholder="Small"
              size="sm"
            />
            <Input 
              leftIcon={SearchIcon}
              placeholder="Medium"
              size="md"
            />
            <Input 
              leftIcon={SearchIcon}
              placeholder="Large"
              size="lg"
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">With Success State (Right Icon Hidden)</h3>
          <Input 
            leftIcon={SearchIcon}
            rightIcon={UserIcon}
            placeholder="Success state"
            success={true}
            value="Valid input"
          />
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">With Error State (Right Icon Hidden)</h3>
          <Input 
            leftIcon={SearchIcon}
            rightIcon={UserIcon}
            placeholder="Error state"
            error="This field is required"
            value="Invalid input"
          />
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Custom Icon Styling</h3>
          <Input 
            leftIcon={EyeIcon}
            leftIconClassName="text-blue-500"
            placeholder="Custom styled icon"
            label="Password"
            type="password"
          />
        </div>
      </div>
    </div>
  );
};