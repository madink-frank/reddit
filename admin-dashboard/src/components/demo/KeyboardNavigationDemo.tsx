import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardNavigation';
import KeyboardShortcutsModal from '../ui/KeyboardShortcutsModal';
import SkipLinks from '../ui/SkipLinks';
import { Keyboard, Info, CheckCircle } from 'lucide-react';

const KeyboardNavigationDemo: React.FC = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: ''
  });

  // Register demo-specific shortcuts
  useKeyboardShortcuts([
    {
      key: 'h',
      description: 'Show keyboard shortcuts help',
      handler: () => setShowShortcuts(true),
      ctrlKey: true
    },
    {
      key: 'd',
      description: 'Demo shortcut - Show message',
      handler: () => setDemoMessage('Demo shortcut activated!'),
      altKey: true
    },
    {
      key: 'c',
      description: 'Clear form',
      handler: () => {
        setFormData({ name: '', category: '', description: '' });
        setDemoMessage('Form cleared!');
      },
      ctrlKey: true,
      shiftKey: true
    }
  ]);

  // Auto-hide demo message after 3 seconds
  useEffect(() => {
    if (demoMessage) {
      const timer = setTimeout(() => setDemoMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [demoMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoMessage('Form submitted successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Skip Links */}
      <SkipLinks 
        links={[
          { href: '#demo-main', text: 'Skip to demo content' },
          { href: '#demo-form', text: 'Skip to demo form' },
          { href: '#demo-shortcuts', text: 'Skip to shortcuts info' }
        ]}
      />

      {/* Header */}
      <header className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-4">
          Keyboard Navigation Demo
        </h1>
        <p className="text-secondary max-w-2xl mx-auto">
          This demo showcases the enhanced keyboard navigation features implemented in the admin dashboard.
          Use Tab to navigate, try the keyboard shortcuts, and test the accessibility features.
        </p>
      </header>

      {/* Demo Message */}
      {demoMessage && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-success" />
          <span className="text-success font-medium">{demoMessage}</span>
        </div>
      )}

      {/* Main Demo Content */}
      <main id="demo-main" tabIndex={-1}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Form */}
          <section id="demo-form" className="space-y-6">
            <h2 className="text-xl font-semibold text-primary">Interactive Form Demo</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                helpText="Use Tab to navigate to the next field"
                required
              />

              <Select
                label="Category"
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                helpText="Use arrow keys to select options"
                required
              >
                <option value="">Select a category</option>
                <option value="demo">Demo</option>
                <option value="test">Test</option>
                <option value="example">Example</option>
              </Select>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-primary mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus"
                  rows={4}
                  placeholder="Enter a description"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="primary">
                  Submit Form
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => {
                    setFormData({ name: '', category: '', description: '' });
                    setDemoMessage('Form reset!');
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </section>

          {/* Keyboard Shortcuts Info */}
          <section id="demo-shortcuts" className="space-y-6">
            <h2 className="text-xl font-semibold text-primary">Keyboard Navigation Features</h2>
            
            <div className="space-y-4">
              <div className="bg-surface-secondary rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">Basic Navigation</h3>
                <ul className="text-sm text-secondary space-y-1">
                  <li>• <kbd className="px-2 py-1 bg-surface-primary rounded text-xs">Tab</kbd> - Move to next element</li>
                  <li>• <kbd className="px-2 py-1 bg-surface-primary rounded text-xs">Shift+Tab</kbd> - Move to previous element</li>
                  <li>• <kbd className="px-2 py-1 bg-surface-primary rounded text-xs">Enter</kbd> - Activate buttons/links</li>
                  <li>• <kbd className="px-2 py-1 bg-surface-primary rounded text-xs">Space</kbd> - Activate buttons</li>
                  <li>• <kbd className="px-2 py-1 bg-surface-primary rounded text-xs">Escape</kbd> - Close modals/clear inputs</li>
                </ul>
              </div>

              <div className="bg-surface-secondary rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">Custom Shortcuts</h3>
                <ul className="text-sm text-secondary space-y-1">
                  <li>• <kbd className="px-2 py-1 bg-surface-primary rounded text-xs">Ctrl+H</kbd> - Show shortcuts help</li>
                  <li>• <kbd className="px-2 py-1 bg-surface-primary rounded text-xs">Alt+D</kbd> - Demo shortcut</li>
                  <li>• <kbd className="px-2 py-1 bg-surface-primary rounded text-xs">Ctrl+Shift+C</kbd> - Clear form</li>
                </ul>
              </div>

              <div className="bg-surface-secondary rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">Accessibility Features</h3>
                <ul className="text-sm text-secondary space-y-1">
                  <li>• Enhanced focus indicators</li>
                  <li>• Screen reader support</li>
                  <li>• Skip links for navigation</li>
                  <li>• ARIA labels and descriptions</li>
                  <li>• High contrast mode support</li>
                </ul>
              </div>

              <Button
                onClick={() => setShowShortcuts(true)}
                variant="outline"
                icon={Keyboard}
                className="w-full"
              >
                View All Keyboard Shortcuts
              </Button>
            </div>
          </section>
        </div>
      </main>

      {/* Additional Demo Buttons */}
      <section className="border-t border-primary pt-8">
        <h2 className="text-xl font-semibold text-primary mb-4">Interactive Elements Demo</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="primary"
            onClick={() => setDemoMessage('Primary button clicked!')}
          >
            Primary
          </Button>
          
          <Button 
            variant="secondary"
            onClick={() => setDemoMessage('Secondary button clicked!')}
          >
            Secondary
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setDemoMessage('Outline button clicked!')}
          >
            Outline
          </Button>
          
          <Button 
            variant="ghost"
            onClick={() => setDemoMessage('Ghost button clicked!')}
          >
            Ghost
          </Button>
        </div>

        <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-info mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary mb-2">Try These Features:</h3>
              <ul className="text-sm text-secondary space-y-1">
                <li>1. Use Tab to navigate through all interactive elements</li>
                <li>2. Press Ctrl+H to open the keyboard shortcuts modal</li>
                <li>3. Try Alt+D to trigger a demo shortcut</li>
                <li>4. Use Escape to clear form inputs (non-required fields)</li>
                <li>5. Notice the enhanced focus indicators on all elements</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
};

export default KeyboardNavigationDemo;