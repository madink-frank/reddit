import { render, screen, fireEvent } from '@testing-library/react';
// Using Jest globals - describe, it, expect, beforeEach, afterEach are available globally
import { Input } from '../components/ui/Input';
import { Select, SelectItem } from '../components/ui/Select';
import { Textarea } from '../components/ui/textarea';

describe('Form Components', () => {
  describe('Input Component', () => {
    it('renders with label and help text', () => {
      render(
        <Input
          label="Test Label"
          helpText="This is help text"
          placeholder="Enter text"
        />
      );

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('This is help text')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('shows error state correctly', () => {
      render(
        <Input
          label="Test Input"
          error="This field is required"
        />
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
      const input = screen.getByLabelText('Test Input');
      expect(input).toHaveClass('border-error');
    });

    it('shows success state correctly', () => {
      render(
        <Input
          label="Test Input"
          success={true}
          value="valid@email.com"
          readOnly
        />
      );

      const input = screen.getByLabelText('Test Input');
      expect(input).toHaveClass('border-success');
    });

    it('shows required indicator', () => {
      render(
        <Input
          label="Required Field"
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('handles different sizes', () => {
      const { rerender } = render(
        <Input label="Small Input" size="sm" />
      );
      
      let input = screen.getByLabelText('Small Input');
      expect(input).toHaveClass('h-8');

      rerender(<Input label="Large Input" size="lg" />);
      input = screen.getByLabelText('Large Input');
      expect(input).toHaveClass('h-12');
    });
  });

  describe('Select Component', () => {
    it('renders with options', () => {
      render(
        <Select label="Test Select" placeholder="Choose option">
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </Select>
      );

      expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('shows error state', () => {
      render(
        <Select
          label="Test Select"
          error="Please select an option"
        >
          <SelectItem value="option1">Option 1</SelectItem>
        </Select>
      );

      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });

    it('handles value changes', () => {
      const handleChange = jest.fn();
      
      render(
        <Select
          label="Test Select"
          onValueChange={handleChange}
        >
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </Select>
      );

      const select = screen.getByLabelText('Test Select');
      fireEvent.change(select, { target: { value: 'option1' } });
      
      expect(handleChange).toHaveBeenCalledWith('option1');
    });
  });

  describe('Textarea Component', () => {
    it('renders with label and help text', () => {
      render(
        <Textarea
          label="Test Textarea"
          helpText="Enter your message"
          placeholder="Type here..."
        />
      );

      expect(screen.getByLabelText('Test Textarea')).toBeInTheDocument();
      expect(screen.getByText('Enter your message')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      render(
        <Textarea
          label="Test Textarea"
          error="Message is required"
        />
      );

      expect(screen.getByText('Message is required')).toBeInTheDocument();
      const textarea = screen.getByLabelText('Test Textarea');
      expect(textarea).toHaveClass('border-error');
    });

    it('handles different resize options', () => {
      const { rerender } = render(
        <Textarea label="No Resize" resize="none" />
      );
      
      let textarea = screen.getByLabelText('No Resize');
      expect(textarea).toHaveClass('resize-none');

      rerender(<Textarea label="Both Resize" resize="both" />);
      textarea = screen.getByLabelText('Both Resize');
      expect(textarea).toHaveClass('resize');
    });

    it('handles different sizes', () => {
      const { rerender } = render(
        <Textarea label="Small Textarea" size="sm" />
      );
      
      let textarea = screen.getByLabelText('Small Textarea');
      expect(textarea).toHaveClass('min-h-[60px]');

      rerender(<Textarea label="Large Textarea" size="lg" />);
      textarea = screen.getByLabelText('Large Textarea');
      expect(textarea).toHaveClass('min-h-[120px]');
    });
  });

  describe('Form Component Integration', () => {
    it('maintains consistent styling across all form components', () => {
      render(
        <div>
          <Input label="Input Field" />
          <Select label="Select Field">
            <SelectItem value="test">Test</SelectItem>
          </Select>
          <Textarea label="Textarea Field" />
        </div>
      );

      const input = screen.getByLabelText('Input Field');
      const select = screen.getByLabelText('Select Field');
      const textarea = screen.getByLabelText('Textarea Field');

      // All should have consistent border and focus styles
      expect(input).toHaveClass('border-primary', 'focus:border-focus');
      expect(select).toHaveClass('border-primary', 'focus:border-focus');
      expect(textarea).toHaveClass('border-primary', 'focus:border-focus');

      // All should have consistent transition
      expect(input).toHaveClass('transition-all', 'duration-200');
      expect(select).toHaveClass('transition-all', 'duration-200');
      expect(textarea).toHaveClass('transition-all', 'duration-200');
    });

    it('shows consistent error styling', () => {
      render(
        <div>
          <Input label="Input Field" error="Input error" />
          <Select label="Select Field" error="Select error">
            <SelectItem value="test">Test</SelectItem>
          </Select>
          <Textarea label="Textarea Field" error="Textarea error" />
        </div>
      );

      const input = screen.getByLabelText('Input Field');
      const select = screen.getByLabelText('Select Field');
      const textarea = screen.getByLabelText('Textarea Field');

      // All should have consistent error styling
      expect(input).toHaveClass('border-error');
      expect(select).toHaveClass('border-error');
      expect(textarea).toHaveClass('border-error');

      // All should show error messages
      expect(screen.getByText('Input error')).toBeInTheDocument();
      expect(screen.getByText('Select error')).toBeInTheDocument();
      expect(screen.getByText('Textarea error')).toBeInTheDocument();
    });
  });
});