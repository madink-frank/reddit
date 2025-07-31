import { render } from '@testing-library/react';
import { Input } from '../components/ui/Input';
import { Search, User, Mail } from 'lucide-react';

describe('Input Component - Responsive Icon Sizing and Positioning', () => {
  // Test icon size specifications
  describe('Icon Size Specifications', () => {
    it('should render small icons with 14px dimensions', () => {
      const { container } = render(
        <Input 
          size="sm" 
          leftIcon={Search} 
          data-testid="small-input"
        />
      );
      
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('width', '14');
      expect(icon).toHaveAttribute('height', '14');
    });

    it('should render medium icons with 16px dimensions', () => {
      const { container } = render(
        <Input 
          size="md" 
          leftIcon={Search} 
          data-testid="medium-input"
        />
      );
      
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('width', '16');
      expect(icon).toHaveAttribute('height', '16');
    });

    it('should render large icons with 18px dimensions', () => {
      const { container } = render(
        <Input 
          size="lg" 
          leftIcon={Search} 
          data-testid="large-input"
        />
      );
      
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('width', '18');
      expect(icon).toHaveAttribute('height', '18');
    });
  });

  // Test responsive positioning classes
  describe('Responsive Positioning Classes', () => {
    it('should apply correct left positioning for different sizes', () => {
      const { container: smallContainer } = render(
        <Input size="sm" leftIcon={Search} />
      );
      const { container: mediumContainer } = render(
        <Input size="md" leftIcon={Search} />
      );
      const { container: largeContainer } = render(
        <Input size="lg" leftIcon={Search} />
      );

      const smallIconContainer = smallContainer.querySelector('[aria-hidden="true"]');
      const mediumIconContainer = mediumContainer.querySelector('[aria-hidden="true"]');
      const largeIconContainer = largeContainer.querySelector('[aria-hidden="true"]');

      expect(smallIconContainer).toHaveClass('left-2.5');
      expect(mediumIconContainer).toHaveClass('left-3');
      expect(largeIconContainer).toHaveClass('left-4');
    });

    it('should apply correct right positioning for different sizes', () => {
      const { container: smallContainer } = render(
        <Input size="sm" rightIcon={Search} />
      );
      const { container: mediumContainer } = render(
        <Input size="md" rightIcon={Search} />
      );
      const { container: largeContainer } = render(
        <Input size="lg" rightIcon={Search} />
      );

      const smallIconContainer = smallContainer.querySelector('[aria-hidden="true"]');
      const mediumIconContainer = mediumContainer.querySelector('[aria-hidden="true"]');
      const largeIconContainer = largeContainer.querySelector('[aria-hidden="true"]');

      expect(smallIconContainer).toHaveClass('right-2.5');
      expect(mediumIconContainer).toHaveClass('right-3');
      expect(largeIconContainer).toHaveClass('right-4');
    });
  });

  // Test variant-specific positioning
  describe('Variant-Specific Icon Positioning', () => {
    it('should apply standard positioning for default variant', () => {
      const { container } = render(
        <Input variant="default" size="md" leftIcon={Search} />
      );
      
      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toHaveClass('left-3');
    });

    it('should apply standard positioning for filled variant', () => {
      const { container } = render(
        <Input variant="filled" size="md" leftIcon={Search} />
      );
      
      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toHaveClass('left-3');
    });

    it('should apply adjusted positioning for outlined variant', () => {
      const { container } = render(
        <Input variant="outlined" size="md" leftIcon={Search} />
      );
      
      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toHaveClass('left-3.5');
    });

    it('should apply proper z-index for outlined variant icons', () => {
      const { container } = render(
        <Input variant="outlined" size="md" leftIcon={Search} />
      );
      
      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toHaveClass('z-10');
    });
  });

  // Test padding calculations for all combinations
  describe('Dynamic Padding Calculations', () => {
    it('should apply correct padding for left icons across sizes', () => {
      const { container: smallContainer } = render(
        <Input size="sm" leftIcon={Search} />
      );
      const { container: mediumContainer } = render(
        <Input size="md" leftIcon={Search} />
      );
      const { container: largeContainer } = render(
        <Input size="lg" leftIcon={Search} />
      );

      const smallInput = smallContainer.querySelector('input');
      const mediumInput = mediumContainer.querySelector('input');
      const largeInput = largeContainer.querySelector('input');

      expect(smallInput).toHaveClass('pl-8');
      expect(mediumInput).toHaveClass('pl-10');
      expect(largeInput).toHaveClass('pl-12');
    });

    it('should apply correct padding for right icons across sizes', () => {
      const { container: smallContainer } = render(
        <Input size="sm" rightIcon={Search} />
      );
      const { container: mediumContainer } = render(
        <Input size="md" rightIcon={Search} />
      );
      const { container: largeContainer } = render(
        <Input size="lg" rightIcon={Search} />
      );

      const smallInput = smallContainer.querySelector('input');
      const mediumInput = mediumContainer.querySelector('input');
      const largeInput = largeContainer.querySelector('input');

      expect(smallInput).toHaveClass('pr-8');
      expect(mediumInput).toHaveClass('pr-10');
      expect(largeInput).toHaveClass('pr-12');
    });

    it('should apply enhanced padding for outlined variant', () => {
      const { container } = render(
        <Input variant="outlined" size="md" leftIcon={Search} rightIcon={User} />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('pl-11', 'pr-11');
    });
  });

  // Test icon scaling with all variant combinations
  describe('Icon Scaling with Input Variants', () => {
    const variants: Array<'default' | 'filled' | 'outlined'> = ['default', 'filled', 'outlined'];
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

    variants.forEach(variant => {
      sizes.forEach(size => {
        it(`should render icons correctly for ${variant} variant with ${size} size`, () => {
          const { container } = render(
            <Input 
              variant={variant} 
              size={size} 
              leftIcon={Search} 
              rightIcon={Mail}
            />
          );

          const icons = container.querySelectorAll('svg');
          const expectedSize = size === 'sm' ? '14' : size === 'md' ? '16' : '18';

          icons.forEach(icon => {
            expect(icon).toHaveAttribute('width', expectedSize);
            expect(icon).toHaveAttribute('height', expectedSize);
          });
        });
      });
    });
  });

  // Test JSX element icons with responsive sizing
  describe('JSX Element Icon Responsive Sizing', () => {
    it('should apply correct dimensions to JSX element icons', () => {
      const CustomIcon = <div data-testid="custom-icon">Custom</div>;
      
      const { container } = render(
        <Input size="lg" leftIcon={CustomIcon} />
      );

      const customIcon = container.querySelector('[data-testid="custom-icon"]');
      expect(customIcon).toHaveStyle({
        width: '18px',
        height: '18px'
      });
    });

    it('should preserve existing styles while adding responsive dimensions', () => {
      const StyledIcon = (
        <div 
          data-testid="styled-icon" 
          style={{ backgroundColor: 'red', color: 'white' }}
        >
          Styled
        </div>
      );
      
      const { container } = render(
        <Input size="md" leftIcon={StyledIcon} />
      );

      const styledIcon = container.querySelector('[data-testid="styled-icon"]');
      expect(styledIcon).toHaveStyle({
        width: '16px',
        height: '16px',
        backgroundColor: 'red',
        color: 'white'
      });
    });
  });

  // Test state indicator precedence with responsive icons
  describe('State Indicator Precedence with Responsive Icons', () => {
    it('should hide right icon when error state is present', () => {
      const { container } = render(
        <Input 
          size="lg" 
          rightIcon={User} 
          error="Test error"
        />
      );

      // Should have error icon but not the custom right icon
      const errorIcon = container.querySelector('svg[viewBox="0 0 24 24"]');
      expect(errorIcon).toBeInTheDocument();
      
      // Custom right icon should not be rendered
      const iconContainers = container.querySelectorAll('[aria-hidden="true"]');
      expect(iconContainers).toHaveLength(0); // No custom icons when error is present
    });

    it('should hide right icon when success state is present', () => {
      const { container } = render(
        <Input 
          size="lg" 
          rightIcon={User} 
          success={true}
        />
      );

      // Should have success icon but not the custom right icon
      const successIcon = container.querySelector('svg[viewBox="0 0 24 24"]');
      expect(successIcon).toBeInTheDocument();
      
      // Custom right icon should not be rendered
      const iconContainers = container.querySelectorAll('[aria-hidden="true"]');
      expect(iconContainers).toHaveLength(0); // No custom icons when success is present
    });
  });

  // Test accessibility with responsive icons
  describe('Accessibility with Responsive Icons', () => {
    it('should maintain aria-hidden attribute on all icon sizes', () => {
      const { container: smallContainer } = render(
        <Input size="sm" leftIcon={Search} rightIcon={User} />
      );
      const { container: largeContainer } = render(
        <Input size="lg" leftIcon={Search} rightIcon={User} />
      );

      const smallIcons = smallContainer.querySelectorAll('[aria-hidden="true"]');
      const largeIcons = largeContainer.querySelectorAll('[aria-hidden="true"]');

      expect(smallIcons).toHaveLength(2);
      expect(largeIcons).toHaveLength(2);

      smallIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
      largeIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});