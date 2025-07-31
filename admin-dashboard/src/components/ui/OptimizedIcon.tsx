import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ICON_SIZES } from '../../constants/design-tokens';
import { optimizeLucideIcon } from '../../utils/svgOptimization';

export interface OptimizedIconProps {
  icon: LucideIcon;
  size?: keyof typeof ICON_SIZES | number;
  className?: string;
  'aria-label'?: string;
  title?: string;
  color?: string;
  strokeWidth?: number;
}

/**
 * Optimized icon component that uses standardized sizes and SVG optimization
 */
export const OptimizedIcon = React.forwardRef<SVGSVGElement, OptimizedIconProps>(({
  icon: Icon,
  size = 'base',
  className = '',
  'aria-label': ariaLabel,
  title,
  color = 'currentColor',
  strokeWidth = 2,
  ...props
}, ref) => {
  // Get standardized size - convert ICON_SIZES key to actual pixel size
  const iconSize = typeof size === 'number' ? size : (() => {
    // Map ICON_SIZES keys to pixel values
    const sizeMap: Record<keyof typeof ICON_SIZES, number> = {
      xs: 12,
      sm: 16,
      base: 20,
      md: 24,
      lg: 32,
      xl: 48,
      '2xl': 64
    };
    return sizeMap[size] || 20; // default to base size (20px)
  })();

  // Create optimized version of the Lucide icon
  const OptimizedLucideIcon = React.useMemo(() => optimizeLucideIcon(Icon), [Icon]);

  return (
    <OptimizedLucideIcon
      ref={ref}
      content={''}
      size={iconSize}
      className={className}
      aria-label={ariaLabel || title}
      title={title}
      color={color}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
});

OptimizedIcon.displayName = 'OptimizedIcon';

/**
 * Icon with loading state
 */
export interface LoadingIconProps extends OptimizedIconProps {
  loading?: boolean;
  loadingIcon?: LucideIcon;
}

export const LoadingIcon: React.FC<LoadingIconProps> = ({
  loading = false,
  loadingIcon,
  icon,
  className = '',
  ...props
}) => {
  if (loading && loadingIcon) {
    return (
      <OptimizedIcon
        icon={loadingIcon}
        className={`animate-spin ${className}`}
        {...props}
      />
    );
  }

  if (loading) {
    const loadingSize = typeof props.size === 'number' ? props.size : (() => {
      const sizeMap: Record<keyof typeof ICON_SIZES, number> = {
        xs: 12,
        sm: 16,
        base: 20,
        md: 24,
        lg: 32,
        xl: 48,
        '2xl': 64
      };
      return sizeMap[props.size || 'base'] || 20;
    })();

    return (
      <div
        className={`animate-pulse bg-gray-300 dark:bg-gray-600 rounded ${className}`}
        style={{
          width: loadingSize,
          height: loadingSize
        }}
      />
    );
  }

  return <OptimizedIcon icon={icon} className={className} {...props} />;
};

/**
 * Icon button with optimized icon
 */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  iconSize?: keyof typeof ICON_SIZES | number;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  'aria-label': string; // Required for accessibility
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  iconSize = 'base',
  variant = 'ghost',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  'aria-label': ariaLabel,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      {...props}
    >
      <LoadingIcon
        icon={icon}
        size={iconSize}
        loading={loading}
      />
      {children}
    </button>
  );
};

/**
 * Icon with badge/notification indicator
 */
export interface BadgedIconProps extends OptimizedIconProps {
  badge?: {
    count?: number;
    show?: boolean;
    color?: 'red' | 'blue' | 'green' | 'yellow' | 'gray';
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };
}

export const BadgedIcon: React.FC<BadgedIconProps> = ({
  badge,
  className = '',
  ...iconProps
}) => {
  const badgeColors = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-black',
    gray: 'bg-gray-500 text-white'
  };

  const badgePositions = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <OptimizedIcon {...iconProps} />

      {badge?.show && (
        <span
          className={`absolute inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none rounded-full ${badgeColors[badge.color || 'red']
            } ${badgePositions[badge.position || 'top-right']}`}
          style={{ minWidth: '1rem', height: '1rem' }}
        >
          {badge.count !== undefined ? (badge.count > 99 ? '99+' : badge.count) : ''}
        </span>
      )}
    </div>
  );
};

/**
 * Animated icon with hover effects - Performance Optimized
 */
export interface AnimatedIconProps extends OptimizedIconProps {
  animation?: 'spin' | 'pulse' | 'bounce' | 'ping' | 'scale' | 'rotate';
  trigger?: 'hover' | 'always' | 'focus';
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  animation = 'scale',
  trigger = 'hover',
  className = '',
  ...iconProps
}) => {
  const iconRef = React.useRef<SVGSVGElement>(null);

  // Use optimized animation classes for better performance
  const animationClasses = {
    spin: 'animate-spin-optimized',
    pulse: 'animate-pulse-optimized',
    bounce: 'animate-bounce-optimized',
    ping: 'animate-ping',
    scale: 'micro-scale',
    rotate: 'transform transition-transform hover:rotate-12 will-change-transform'
  };

  const triggerClasses = {
    hover: animation === 'scale' || animation === 'rotate' ? animationClasses[animation] : `hover:${animationClasses[animation]}`,
    always: animationClasses[animation],
    focus: `focus:${animationClasses[animation]}`
  };

  // Apply performance optimizations
  React.useEffect(() => {
    const element = iconRef.current;
    if (!element) return;

    // Apply GPU acceleration and will-change for better performance
    if (animation === 'spin' || animation === 'pulse' || animation === 'bounce') {
      element.style.willChange = 'transform, opacity';
      element.style.transform = element.style.transform || 'translateZ(0)';
    } else if (animation === 'scale' || animation === 'rotate') {
      element.style.willChange = 'transform';
      element.style.transform = element.style.transform || 'translateZ(0)';
    }

    // Cleanup on unmount
    return () => {
      if (element) {
        element.style.willChange = 'auto';
      }
    };
  }, [animation]);

  return (
    <OptimizedIcon
      ref={iconRef}
      className={`${triggerClasses[trigger]} gpu-accelerated ${className}`}
      {...iconProps}
    />
  );
};

export default OptimizedIcon;