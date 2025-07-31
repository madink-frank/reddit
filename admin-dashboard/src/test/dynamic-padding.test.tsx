import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from '../components/ui/Input';

// Mock icon components for testing
const MockSearchIcon = () => <svg data-testid="search-icon" width="16" height="16" />;
const MockUserIcon = () => <svg data-testid="user-icon" width="16" height="16" />;

describe('Dynamic Padding Calculation System', () => {
  describe('getPaddingClasses functionality', () => {
    it('should apply base padding when no icons are present', () => {
      render(<Input placeholder="No icons" data-testid="input-no-icons" />);
      const input = screen.getByTestId('input-no-icons');
      
      // Should have base padding classes
      expect(input).toHaveClass('pl-3', 'pr-3'); // md size default
    });

    it('should apply left icon padding when left icon is present', () => {
      render(
        <Input 
          placeholder="Left icon" 
          leftIcon={MockSearchIcon} 
          data-testid="input-left-icon" 
        />
      );
      const input = screen.getByTestId('input-left-icon');
      
      // Should have left icon padding
      expect(input).toHaveClass('pl-10', 'pr-3'); // md size with left icon
    });

    it('should apply right icon padding when right icon is present', () => {
      render(
        <Input 
          placeholder="Right icon" 
          rightIcon={MockUserIcon} 
          data-testid="input-right-icon" 
        />
      );
      const input = screen.getByTestId('input-right-icon');
      
      // Should have right icon padding
      expect(input).toHaveClass('pl-3', 'pr-10'); // md size with right icon
    });

    it('should apply both icon paddings when both icons are present', () => {
      render(
        <Input 
          placeholder="Both icons" 
          leftIcon={MockSearchIcon} 
          rightIcon={MockUserIcon} 
          data-testid="input-both-icons" 
        />
      );
      const input = screen.getByTestId('input-both-icons');
      
      // Should have both icon paddings
      expect(input).toHaveClass('pl-10', 'pr-10'); // md size with both icons
    });
  });

  describe('State indicator precedence', () => {
    it('should prioritize success state indicator over right icon', () => {
      render(
        <Input 
          placeholder="Success with right icon" 
          rightIcon={MockUserIcon} 
          success={true}
          data-testid="input-success-right-icon" 
        />
      );
      const input = screen.getByTestId('input-success-right-icon');
      
      // Should have right padding for state indicator, not custom right icon
      expect(input).toHaveClass('pl-3', 'pr-10'); // md size with state indicator
      
      // Success icon should be visible, custom right icon should not
      const successIcon = input.parentElement?.querySelector('svg[stroke="currentColor"]');
      expect(successIcon).toBeInTheDocument();
    });

    it('should prioritize error state indicator over right icon', () => {
      render(
        <Input 
          placeholder="Error with right icon" 
          rightIcon={MockUserIcon} 
          error="Error message"
          data-testid="input-error-right-icon" 
        />
      );
      const input = screen.getByTestId('input-error-right-icon');
      
      // Should have right padding for state indicator
      expect(input).toHaveClass('pl-3', 'pr-10'); // md size with state indicator
      
      // Error icon should be visible
      const errorIcon = input.parentElement?.querySelector('svg[stroke="currentColor"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should show right icon when no state indicators are present', () => {
      render(
        <Input 
          placeholder="Right icon only" 
          rightIcon={MockUserIcon} 
          data-testid="input-right-icon-only" 
        />
      );
      const input = screen.getByTestId('input-right-icon-only');
      
      // Should have right icon padding
      expect(input).toHaveClass('pl-3', 'pr-10');
      
      // Custom right icon should be visible (rendered by renderIcon function)
      const iconContainer = input.parentElement?.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Size-specific padding', () => {
    it('should apply correct padding for small size', () => {
      render(
        <Input 
          placeholder="Small with icons" 
          leftIcon={MockSearchIcon} 
          rightIcon={MockUserIcon} 
          size="sm"
          data-testid="input-sm-icons" 
        />
      );
      const input = screen.getByTestId('input-sm-icons');
      
      // Should have small size icon paddings
      expect(input).toHaveClass('pl-8', 'pr-8'); // sm size with both icons
    });

    it('should apply correct padding for medium size', () => {
      render(
        <Input 
          placeholder="Medium with icons" 
          leftIcon={MockSearchIcon} 
          rightIcon={MockUserIcon} 
          size="md"
          data-testid="input-md-icons" 
        />
      );
      const input = screen.getByTestId('input-md-icons');
      
      // Should have medium size icon paddings
      expect(input).toHaveClass('pl-10', 'pr-10'); // md size with both icons
    });

    it('should apply correct padding for large size', () => {
      render(
        <Input 
          placeholder="Large with icons" 
          leftIcon={MockSearchIcon} 
          rightIcon={MockUserIcon} 
          size="lg"
          data-testid="input-lg-icons" 
        />
      );
      const input = screen.getByTestId('input-lg-icons');
      
      // Should have large size icon paddings
      expect(input).toHaveClass('pl-12', 'pr-12'); // lg size with both icons
    });
  });

  describe('Icon position constants', () => {
    it('should position left icons correctly for different sizes', () => {
      const { rerender } = render(
        <Input leftIcon={MockSearchIcon} size="sm" data-testid="input-left-sm" />
      );
      
      let iconContainer = screen.getByTestId('input-left-sm').parentElement?.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toHaveClass('left-2.5');
      
      rerender(<Input leftIcon={MockSearchIcon} size="md" data-testid="input-left-md" />);
      iconContainer = screen.getByTestId('input-left-md').parentElement?.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toHaveClass('left-3');
      
      rerender(<Input leftIcon={MockSearchIcon} size="lg" data-testid="input-left-lg" />);
      iconContainer = screen.getByTestId('input-left-lg').parentElement?.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toHaveClass('left-4');
    });

    it('should position right icons correctly for different sizes', () => {
      const { rerender } = render(
        <Input rightIcon={MockUserIcon} size="sm" data-testid="input-right-sm" />
      );
      
      let iconContainers = screen.getByTestId('input-right-sm').parentElement?.querySelectorAll('[aria-hidden="true"]');
      let rightIconContainer = Array.from(iconContainers || []).find(el => el.classList.contains('right-2.5'));
      expect(rightIconContainer).toBeInTheDocument();
      
      rerender(<Input rightIcon={MockUserIcon} size="md" data-testid="input-right-md" />);
      iconContainers = screen.getByTestId('input-right-md').parentElement?.querySelectorAll('[aria-hidden="true"]');
      rightIconContainer = Array.from(iconContainers || []).find(el => el.classList.contains('right-3'));
      expect(rightIconContainer).toBeInTheDocument();
      
      rerender(<Input rightIcon={MockUserIcon} size="lg" data-testid="input-right-lg" />);
      iconContainers = screen.getByTestId('input-right-lg').parentElement?.querySelectorAll('[aria-hidden="true"]');
      rightIconContainer = Array.from(iconContainers || []).find(el => el.classList.contains('right-4'));
      expect(rightIconContainer).toBeInTheDocument();
    });
  });

  describe('Complex combinations', () => {
    it('should handle left icon with success state correctly', () => {
      render(
        <Input 
          placeholder="Left icon with success" 
          leftIcon={MockSearchIcon} 
          success={true}
          data-testid="input-left-success" 
        />
      );
      const input = screen.getByTestId('input-left-success');
      
      // Should have left icon padding and right state indicator padding
      expect(input).toHaveClass('pl-10', 'pr-10'); // md size with left icon and state indicator
    });

    it('should handle left icon with error state correctly', () => {
      render(
        <Input 
          placeholder="Left icon with error" 
          leftIcon={MockSearchIcon} 
          error="Error message"
          data-testid="input-left-error" 
        />
      );
      const input = screen.getByTestId('input-left-error');
      
      // Should have left icon padding and right state indicator padding
      expect(input).toHaveClass('pl-10', 'pr-10'); // md size with left icon and state indicator
    });

    it('should handle all combinations: left icon, right icon, and state indicator', () => {
      render(
        <Input 
          placeholder="All combinations" 
          leftIcon={MockSearchIcon} 
          rightIcon={MockUserIcon} 
          error="Error message"
          data-testid="input-all-combinations" 
        />
      );
      const input = screen.getByTestId('input-all-combinations');
      
      // Should have both icon paddings (state indicator takes precedence over right icon)
      expect(input).toHaveClass('pl-10', 'pr-10'); // md size with left icon and state indicator
      
      // Left icon should be visible
      const leftIconContainer = input.parentElement?.querySelector('[aria-hidden="true"].left-3');
      expect(leftIconContainer).toBeInTheDocument();
      
      // Error state indicator should be visible (not custom right icon)
      const errorIcon = input.parentElement?.querySelector('svg[stroke="currentColor"]');
      expect(errorIcon).toBeInTheDocument();
    });
  });
});