import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select, SelectItem } from '../ui/Select';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const FormComponentsDemo: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    message: '',
    website: '',
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Simple validation for demo
    if (field === 'email' && value) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (isValid) {
        setSuccess(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({ ...prev, [field]: '' }));
      } else {
        setSuccess(prev => ({ ...prev, [field]: false }));
        setErrors(prev => ({ ...prev, [field]: 'Please enter a valid email address' }));
      }
    }

    if (field === 'name' && value.length >= 2) {
      setSuccess(prev => ({ ...prev, [field]: true }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.message) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      alert('Form submitted successfully!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Form Components Demo
        </h1>
        <p className="text-tertiary">
          Showcasing unified form input field styles with consistent focus states, error handling, and accessibility features.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                success={success.name}
                helpText="This will be displayed publicly"
                required
              />

              <Input
                type="email"
                label="Email Address"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                success={success.email}
                helpText="We'll never share your email with anyone else"
                required
              />

              <Select
                label="Category"
                placeholder="Select a category"
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
                error={errors.category}
                helpText="Choose the most relevant category"
                required
              >
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="support">Technical Support</SelectItem>
                <SelectItem value="billing">Billing Question</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
              </Select>

              <Textarea
                label="Message"
                placeholder="Tell us how we can help you..."
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                error={errors.message}
                helpText="Please provide as much detail as possible"
                rows={4}
                required
              />

              <div className="flex gap-3">
                <Button type="submit" variant="primary">
                  Send Message
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      name: '',
                      email: '',
                      category: '',
                      message: '',
                      website: '',
                      description: ''
                    });
                    setErrors({});
                    setSuccess({});
                  }}
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Component Variants */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Default Input"
                placeholder="Default variant"
                variant="default"
              />
              
              <Input
                label="Filled Input"
                placeholder="Filled variant"
                variant="filled"
              />
              
              <Input
                label="Outlined Input"
                placeholder="Outlined variant"
                variant="outlined"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Input Sizes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Small Input"
                placeholder="Small size"
                size="sm"
              />
              
              <Input
                label="Medium Input (Default)"
                placeholder="Medium size"
                size="md"
              />
              
              <Input
                label="Large Input"
                placeholder="Large size"
                size="lg"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Default Select"
                placeholder="Choose an option"
                variant="default"
              >
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </Select>
              
              <Select
                label="Filled Select"
                placeholder="Choose an option"
                variant="filled"
              >
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Textarea Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Default Textarea"
                placeholder="Enter your text here..."
                variant="default"
                size="sm"
              />
              
              <Textarea
                label="Filled Textarea"
                placeholder="Enter your text here..."
                variant="filled"
                resize="none"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form States</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Success State"
                placeholder="Valid input"
                value="john@example.com"
                success={true}
                helpText="This email is available"
                readOnly
              />
              
              <Input
                label="Error State"
                placeholder="Invalid input"
                value="invalid-email"
                error="Please enter a valid email address"
              />
              
              <Input
                label="Disabled State"
                placeholder="Disabled input"
                disabled
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accessibility Features */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-primary mb-3">Keyboard Navigation</h3>
              <ul className="text-sm text-tertiary space-y-1">
                <li>• Tab to navigate between form fields</li>
                <li>• Enter to submit forms</li>
                <li>• Arrow keys for select options</li>
                <li>• Escape to close dropdowns</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-primary mb-3">Screen Reader Support</h3>
              <ul className="text-sm text-tertiary space-y-1">
                <li>• Proper label associations</li>
                <li>• ARIA attributes for states</li>
                <li>• Error announcements</li>
                <li>• Required field indicators</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-primary mb-3">Visual Indicators</h3>
              <ul className="text-sm text-tertiary space-y-1">
                <li>• Clear focus outlines</li>
                <li>• Color-coded error states</li>
                <li>• Success confirmation icons</li>
                <li>• Consistent hover effects</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-primary mb-3">Responsive Design</h3>
              <ul className="text-sm text-tertiary space-y-1">
                <li>• Touch-friendly on mobile</li>
                <li>• Adaptive sizing</li>
                <li>• Readable text at all sizes</li>
                <li>• Proper spacing on all devices</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormComponentsDemo;