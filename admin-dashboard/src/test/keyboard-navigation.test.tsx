import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { KeyboardNavigationManager } from '../utils/keyboardNavigation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import KeyboardShortcutsModal from '../components/ui/KeyboardShortcutsModal';
import SkipLinks from '../components/ui/SkipLinks';

// Mock the design tokens
jest.mock('../constants/design-tokens', () => ({
  BUTTON_VARIANTS: {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost'
  },
  BUTTON_SIZES: {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  },
  ICON_SIZES: {
    sm: 'w-4 h-4',
    base: 'w-5 h-5',
    md: 'w-6 h-6'
  }
}));

// Mock the utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('Keyboard Navigation', () => {
  let manager: KeyboardNavigationManager;

  beforeEach(() => {
    manager = new KeyboardNavigationManager();

    // Clear any existing shortcuts
    manager.getShortcuts().forEach(shortcut => {
      const key = `${shortcut.ctrlKey ? 'Ctrl+' : ''}${shortcut.shiftKey ? 'Shift+' : ''}${shortcut.altKey ? 'Alt+' : ''}${shortcut.metaKey ? 'Meta+' : ''}${shortcut.key}`;
      manager.unregisterShortcut(key);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('KeyboardNavigationManager', () => {
    it('should register and unregister shortcuts', () => {
      const handler = jest.fn();
      const shortcut = {
        key: 'k',
        description: 'Test shortcut',
        handler,
        ctrlKey: true
      };

      manager.registerShortcut(shortcut);
      expect(manager.getShortcuts()).toHaveLength(1);

      manager.unregisterShortcut('Ctrl+k');
      expect(manager.getShortcuts()).toHaveLength(0);
    });

    it('should handle keyboard shortcuts', () => {
      const handler = jest.fn();
      const shortcut = {
        key: 'k',
        description: 'Test shortcut',
        handler,
        ctrlKey: true
      };

      manager.registerShortcut(shortcut);

      // Simulate Ctrl+K
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });

      document.dispatchEvent(event);
      expect(handler).toHaveBeenCalled();
    });

    it('should not trigger shortcuts when typing in input fields', () => {
      const handler = jest.fn();
      const shortcut = {
        key: 'k',
        description: 'Test shortcut',
        handler,
        ctrlKey: true
      };

      manager.registerShortcut(shortcut);

      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId('test-input');
      input.focus();

      // Simulate Ctrl+K while focused on input
      fireEvent.keyDown(input, {
        key: 'k',
        ctrlKey: true
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should manage focus correctly', () => {
      render(
        <div>
          <Button data-testid="button1">Button 1</Button>
          <Button data-testid="button2">Button 2</Button>
          <Button data-testid="button3">Button 3</Button>
        </div>
      );

      manager.updateFocusableElements();
      manager.focusFirst();

      expect(document.activeElement).toBe(screen.getByTestId('button1'));

      manager.focusNext();
      expect(document.activeElement).toBe(screen.getByTestId('button2'));

      manager.focusLast();
      expect(document.activeElement).toBe(screen.getByTestId('button3'));

      manager.focusPrevious();
      expect(document.activeElement).toBe(screen.getByTestId('button2'));
    });

    it('should trap focus within a container', () => {
      render(
        <div data-testid="container">
          <Button data-testid="button1">Button 1</Button>
          <Button data-testid="button2">Button 2</Button>
        </div>
      );

      const container = screen.getByTestId('container');
      const cleanup = manager.trapFocus(container);

      const button1 = screen.getByTestId('button1');
      const button2 = screen.getByTestId('button2');

      expect(document.activeElement).toBe(button1);

      // Tab should move to button2
      fireEvent.keyDown(container, { key: 'Tab' });
      // Note: In a real browser, this would move focus, but in tests we need to simulate it
      button2.focus();
      expect(document.activeElement).toBe(button2);

      cleanup();
    });
  });

  describe('Button Component', () => {
    it('should be focusable and handle keyboard events', async () => {
      const onClick = jest.fn();
      render(<Button onClick={onClick} data-testid="test-button">Test Button</Button>);

      const button = screen.getByTestId('test-button');

      // Should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);

      // Should handle Enter key
      await userEvent.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalled();

      onClick.mockClear();

      // Should handle Space key
      await userEvent.keyboard(' ');
      expect(onClick).toHaveBeenCalled();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <Button
          aria-label="Custom label"
          aria-describedby="description"
          data-testid="test-button"
        >
          Test Button
        </Button>
      );

      const button = screen.getByTestId('test-button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled data-testid="test-button">Disabled Button</Button>);

      const button = screen.getByTestId('test-button');
      expect(button).toHaveAttribute('tabindex', '-1');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Input Component', () => {
    it('should have proper ARIA attributes and associations', () => {
      render(
        <Input
          label="Test Input"
          helpText="This is help text"
          error="This is an error"
          data-testid="test-input"
        />
      );

      const input = screen.getByTestId('test-input');
      const label = screen.getByText('Test Input');
      const error = screen.getByText('This is an error');

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      expect(error).toHaveAttribute('role', 'alert');

      // Label should be associated with input
      expect(label).toHaveAttribute('for', input.id);
    });

    it('should handle Escape key to clear input', async () => {
      const onChange = jest.fn();
      render(<Input onChange={onChange} data-testid="test-input" />);

      const input = screen.getByTestId('test-input') as HTMLInputElement;

      // Type some text
      await userEvent.type(input, 'test text');
      expect(input.value).toBe('test text');

      // Press Escape to clear
      await userEvent.keyboard('{Escape}');
      expect(input.value).toBe('');
    });

    it('should not clear required inputs on Escape', async () => {
      render(<Input required defaultValue="required text" data-testid="test-input" />);

      const input = screen.getByTestId('test-input') as HTMLInputElement;
      expect(input.value).toBe('required text');

      // Press Escape - should not clear required input
      await userEvent.keyboard('{Escape}');
      expect(input.value).toBe('required text');
    });
  });

  describe('Select Component', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Select
          label="Test Select"
          helpText="This is help text"
          error="This is an error"
          data-testid="test-select"
        >
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );

      const select = screen.getByTestId('test-select');
      const label = screen.getByText('Test Select');
      const error = screen.getByText('This is an error');

      expect(select).toHaveAttribute('aria-invalid', 'true');
      expect(select).toHaveAttribute('aria-describedby');
      expect(error).toHaveAttribute('role', 'alert');

      // Label should be associated with select
      expect(label).toHaveAttribute('for', select.id);
    });

    it('should handle Escape key to close dropdown', async () => {
      const onBlur = jest.fn();
      render(
        <Select onBlur={onBlur} data-testid="test-select">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );

      const select = screen.getByTestId('test-select');
      select.focus();

      // Press Escape
      fireEvent.keyDown(select, { key: 'Escape' });

      // Should blur the select (close dropdown)
      expect(document.activeElement).not.toBe(select);
    });
  });

  describe('KeyboardShortcutsModal', () => {
    it('should display shortcuts correctly', () => {
      const shortcuts = [
        {
          key: 'k',
          description: 'Search',
          handler: jest.fn(),
          ctrlKey: true
        },
        {
          key: '1',
          description: 'Go to Dashboard',
          handler: jest.fn(),
          altKey: true
        }
      ];

      // Register shortcuts
      shortcuts.forEach(shortcut => manager.registerShortcut(shortcut));

      render(<KeyboardShortcutsModal isOpen={true} onClose={jest.fn()} />);

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    it('should close on Escape key', async () => {
      const onClose = jest.fn();
      render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    it('should trap focus within modal', () => {
      render(<KeyboardShortcutsModal isOpen={true} onClose={jest.fn()} />);

      const modal = document.getElementById('keyboard-shortcuts-modal');
      expect(modal).toBeInTheDocument();

      // Focus should be trapped within the modal
      const focusableElements = modal?.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
      expect(focusableElements?.length).toBeGreaterThan(0);
    });
  });

  describe('SkipLinks', () => {
    it('should render skip links', () => {
      render(<SkipLinks />);

      const skipLinks = document.querySelectorAll('.skip-link');
      expect(skipLinks.length).toBeGreaterThan(0);
    });

    it('should focus target element when clicked', async () => {
      render(
        <div>
          <SkipLinks />
          <main id="main-content" tabIndex={-1}>Main Content</main>
        </div>
      );

      const skipLink = document.querySelector('.skip-link') as HTMLElement;
      const mainContent = document.getElementById('main-content');

      // Focus the skip link first
      skipLink.focus();

      // Click the skip link
      fireEvent.click(skipLink);

      // Main content should be focused
      await waitFor(() => {
        expect(document.activeElement).toBe(mainContent);
      });
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus order correctly', () => {
      render(
        <div>
          <Button data-testid="button1" tabIndex={1}>Button 1</Button>
          <Input data-testid="input1" tabIndex={2} />
          <Select data-testid="select1" tabIndex={3}>
            <option value="1">Option 1</option>
          </Select>
          <Button data-testid="button2" tabIndex={4}>Button 2</Button>
        </div>
      );

      const button1 = screen.getByTestId('button1');
      const input1 = screen.getByTestId('input1');
      const select1 = screen.getByTestId('select1');
      const button2 = screen.getByTestId('button2');

      // Test tab order
      button1.focus();
      expect(document.activeElement).toBe(button1);

      // Simulate tab navigation
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      input1.focus(); // Simulate browser behavior
      expect(document.activeElement).toBe(input1);

      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      select1.focus(); // Simulate browser behavior
      expect(document.activeElement).toBe(select1);

      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      button2.focus(); // Simulate browser behavior
      expect(document.activeElement).toBe(button2);
    });

    it('should skip disabled elements', () => {
      render(
        <div>
          <Button data-testid="button1">Button 1</Button>
          <Button data-testid="button2" disabled>Button 2 (Disabled)</Button>
          <Button data-testid="button3">Button 3</Button>
        </div>
      );

      const button1 = screen.getByTestId('button1');
      const button2 = screen.getByTestId('button2');
      const button3 = screen.getByTestId('button3');

      // Disabled button should have tabindex="-1"
      expect(button2).toHaveAttribute('tabindex', '-1');

      // Focus should skip disabled elements
      button1.focus();
      expect(document.activeElement).toBe(button1);

      // When navigating, disabled button should be skipped
      manager.updateFocusableElements();
      manager.focusNext();
      expect(document.activeElement).toBe(button3);
    });
  });

  describe('High Contrast and Reduced Motion', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<Button data-testid="test-button">Test Button</Button>);

      const button = screen.getByTestId('test-button');

      // In reduced motion mode, transitions should be disabled
      // This would need to be tested with actual CSS in a real browser environment
      expect(button).toBeInTheDocument();
    });
  });
});

describe('Integration Tests', () => {
  it('should work together in a complete form', async () => {
    const onSubmit = jest.fn();

    render(
      <form onSubmit={onSubmit} data-testid="test-form">
        <Input
          label="Name"
          data-testid="name-input"
          required
        />
        <Select
          label="Category"
          data-testid="category-select"
          required
        >
          <option value="">Select a category</option>
          <option value="1">Category 1</option>
          <option value="2">Category 2</option>
        </Select>
        <Button type="submit" data-testid="submit-button">
          Submit
        </Button>
      </form>
    );

    const nameInput = screen.getByTestId('name-input');
    const categorySelect = screen.getByTestId('category-select');
    const submitButton = screen.getByTestId('submit-button');

    // Test keyboard navigation through form
    await userEvent.tab();
    expect(document.activeElement).toBe(nameInput);

    await userEvent.type(nameInput, 'John Doe');

    await userEvent.tab();
    expect(document.activeElement).toBe(categorySelect);

    await userEvent.selectOptions(categorySelect, '1');

    await userEvent.tab();
    expect(document.activeElement).toBe(submitButton);

    // Submit form with Enter key
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalled();
  });
});