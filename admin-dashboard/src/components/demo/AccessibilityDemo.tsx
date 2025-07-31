import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Search, User, Eye, EyeOff, Mail, Lock } from 'lucide-react';

export const AccessibilityDemo: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    search: '',
    username: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      alert('Form submitted successfully!');
    }
  };

  const PasswordToggleIcon = showPassword ? EyeOff : Eye;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">
          Input Accessibility Demo
        </h1>
        <p className="text-tertiary">
          Demonstrating enhanced accessibility features with icons
        </p>
      </div>

      {/* Search Example */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-primary">Search Input</h2>
        <Input
          leftIcon={Search}
          placeholder="Search for anything..."
          value={formData.search}
          onChange={handleInputChange('search')}
          label="Search"
          helpText="Use the search icon to find content quickly"
          aria-describedby="search-instructions"
        />
        <p id="search-instructions" className="text-xs text-tertiary">
          Press Escape to clear the search field
        </p>
      </div>

      {/* Form Example */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-lg font-semibold text-primary">Registration Form</h2>

        <Input
          leftIcon={User}
          label="Username"
          placeholder="Enter your username"
          value={formData.username}
          onChange={handleInputChange('username')}
          error={errors.username}
          required
          helpText="Choose a unique username"
        />

        <Input
          leftIcon={Mail}
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleInputChange('email')}
          error={errors.email}
          success={!!formData.email && !errors.email && /\S+@\S+\.\S+/.test(formData.email)}
          required
          helpText="We'll never share your email with anyone"
        />

        <div className="relative">
          <Input
            leftIcon={Lock}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:bg-surface-secondary rounded transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                <PasswordToggleIcon size={16} />
              </button>
            }
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            success={!!formData.password && !errors.password && formData.password.length >= 6}
            required
            helpText="Password must be at least 6 characters long"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Register
        </button>
      </form>

      {/* Accessibility Features Summary */}
      <div className="bg-surface-secondary p-4 rounded-lg">
        <h3 className="font-semibold text-primary mb-3">Accessibility Features Implemented:</h3>
        <ul className="space-y-2 text-sm text-secondary">
          <li>✅ Icons are marked with <code>aria-hidden="true"</code> to prevent screen reader confusion</li>
          <li>✅ Focus ring encompasses the entire input container including icons</li>
          <li>✅ Keyboard navigation works properly with Tab and Escape keys</li>
          <li>✅ Error messages have <code>role="alert"</code> for screen reader announcements</li>
          <li>✅ State indicators (success/error) take precedence over custom right icons</li>
          <li>✅ All existing ARIA attributes are maintained</li>
          <li>✅ Labels are properly associated with inputs</li>
          <li>✅ Help text is linked via <code>aria-describedby</code></li>
        </ul>
      </div>

      {/* Keyboard Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3">Keyboard Navigation:</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li><kbd className="px-2 py-1 bg-blue-200 rounded text-xs">Tab</kbd> - Navigate between inputs</li>
          <li><kbd className="px-2 py-1 bg-blue-200 rounded text-xs">Escape</kbd> - Clear non-required inputs</li>
          <li><kbd className="px-2 py-1 bg-blue-200 rounded text-xs">Enter</kbd> - Submit form</li>
        </ul>
      </div>
    </div>
  );
};

export default AccessibilityDemo;