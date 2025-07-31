import { render } from '@testing-library/react';
import { Input } from '../components/ui/Input';

// Mock Lucide React icons for testing
const MockSearchIcon = () => <svg data-testid="search-icon" width="16" height="16" />;
const MockUserIcon = () => <svg data-testid="user-icon" width="16" height="16" />;

describe('Input Component - Responsive Icon Sizing (Simple)', () => {
  // Test basic icon rendering
  describe('Basic Icon Rendering', () => {
    it('should render left icon', () => {
      const { container } = render(
        <Input leftIcon={MockSearchIcon} />
      );
      
      const icon = container.querySelector('[data-testid="search-icon"]');
      expect(icon).toBeInTheDocument();
    });

    it('should render right icon', () => {
      const { container } = render(
        <Input rightIcon={MockUserIcon} />
      );
      
      const icon = container.querySelector('[data-testid="user-icon"]');
      expect(icon).toBeInTheDocument();
    });

    it('should render both left and right icons', () => {
      const { container } = render(
        <Input leftIcon={MockSearchIcon} rightIcon={MockUserIcon} />
      );
      
      const searchIcon = container.querySelector('[data-testid="search-icon"]');
      const userIcon = container.querySelector('[data-testid="user-icon"]');
      
      expect(searchIcon).toBeInTheDocument();
      expect(userIcon).toBeInTheDocument();
    });
  });

  // Test padding calculations
  describe('Dynamic Padding', () => {
    it('should apply left padding when left icon is present', () => {
      const { container } = render(
        <Input size="md" leftIcon={MockSearchIcon} />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('pl-10');
    });

    it('should apply right padding when right icon is present', () => {
      const { container } = render(
        <Input size="md" rightIcon={MockUserIcon} />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('pr-10');
    });

    it('should apply both paddings when both icons are present', () => {
      const { container } = render(
        <Input size="md" leftIcon={MockSearchIcon} rightIcon={MockUserIcon} />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('pl-10', 'pr-10');
    });
  });

  // Test size-specific padding
  describe('Size-Specific Padding', () => {
    it('should apply correct padding for small size', () => {
      const { container } = render(
        <Input size="sm" leftIcon={MockSearchIcon} rightIcon={MockUserIcon} />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('pl-8', 'pr-8');
    });

    it('should apply correct padding for medium size', () => {
      const { container } = render(
        <Input size="md" leftIcon={MockSearchIcon} rightIcon={MockUserIcon} />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('pl-10', 'pr-10');
    });

    it('should apply correct padding for large size', () => {
      const { container } = render(
        <Input size="lg" leftIcon={MockSearchIcon} rightIcon={MockUserIcon} />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('pl-12', 'pr-12');
    });
  });

  // Test variant-specific padding
  describe('Variant-Specific Padding', () => {
    it('should apply standard padding for default variant', () => {
      const { container } = render(
        <Input variant="default" size="md" leftIcon={MockSearchIcon} />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('pl-10');
    });

    it('should apply standard padding for filled variant', () => {
      const { container } = render(
        <Input variant="filled" size="md" leftIcon={MockSearchIcon} />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('pl-10');
    });

    it('should apply enhanced padding for outlined variant', () => {
      const { container } = render(
        <Input variant="outlined" size="md" leftIcon={MockSearchIcon} />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('pl-11');
    });
  });

  // Test state indicator precedence
  describe('State Indicator Precedence', () => {
    it('should hide right icon when error is present', () => {
      const { container } = render(
        <Input rightIcon={MockUserIcon} error="Test error" />
      );
      
      // Should not render the custom right icon
      const userIcon = container.querySelector('[data-testid="user-icon"]');
      expect(userIcon).not.toBeInTheDocument();
      
      // Should render error icon
      const errorIcon = container.querySelector('svg[viewBox="0 0 24 24"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should hide right icon when success is present', () => {
      const { container } = render(
        <Input rightIcon={MockUserIcon} success={true} />
      );
      
      // Should not render the custom right icon
      const userIcon = container.querySelector('[data-testid="user-icon"]');
      expect(userIcon).not.toBeInTheDocument();
      
      // Should render success icon
      const successIcon = container.querySelector('svg[viewBox="0 0 24 24"]');
      expect(successIcon).toBeInTheDocument();
    });

    it('should still render left icon when error is present', () => {
      const { container } = render(
        <Input leftIcon={MockSearchIcon} error="Test error" />
      );
      
      // Should render the left icon
      const searchIcon = container.querySelector('[data-testid="search-icon"]');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  // Test accessibility
  describe('Accessibility', () => {
    it('should add aria-hidden to icon containers', () => {
      const { container } = render(
        <Input leftIcon={MockSearchIcon} rightIcon={MockUserIcon} />
      );
      
      const iconContainers = container.querySelectorAll('[aria-hidden="true"]');
      expect(iconContainers.length).toBeGreaterThan(0);
    });
  });
});