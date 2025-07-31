import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton loading component for better perceived performance
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
};

/**
 * Skeleton for text content
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        height={16}
        width={index === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

/**
 * Skeleton for cards
 */
export const SkeletonCard: React.FC<{
  className?: string;
  showAvatar?: boolean;
}> = ({ className = '', showAvatar = false }) => (
  <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
    {showAvatar && (
      <div className="flex items-center space-x-3 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton variant="text" height={16} width="60%" />
          <Skeleton variant="text" height={14} width="40%" className="mt-1" />
        </div>
      </div>
    )}
    <Skeleton variant="text" height={20} width="80%" className="mb-2" />
    <SkeletonText lines={3} />
    <div className="flex space-x-2 mt-4">
      <Skeleton variant="rectangular" width={80} height={32} />
      <Skeleton variant="rectangular" width={80} height={32} />
    </div>
  </div>
);

/**
 * Skeleton for tables
 */
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" height={20} width="100%" />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" height={16} width="100%" />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Skeleton for charts
 */
export const SkeletonChart: React.FC<{
  type?: 'line' | 'bar' | 'pie';
  className?: string;
}> = ({ type = 'line', className = '' }) => (
  <div className={`p-4 ${className}`}>
    <Skeleton variant="text" height={24} width="40%" className="mb-4" />

    {type === 'pie' ? (
      <div className="flex justify-center">
        <Skeleton variant="circular" width={200} height={200} />
      </div>
    ) : (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-end space-x-1">
            {Array.from({ length: 12 }).map((_, barIndex) => (
              <Skeleton
                key={barIndex}
                variant="rectangular"
                width={20}
                height={Math.random() * 100 + 20}
              />
            ))}
          </div>
        ))}
      </div>
    )}
  </div>
);

/**
 * Skeleton for dashboard stats
 */
export const SkeletonStats: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton variant="text" height={14} width="60%" />
            <Skeleton variant="text" height={32} width="80%" className="mt-2" />
          </div>
          <Skeleton variant="circular" width={48} height={48} />
        </div>
      </div>
    ))}
  </div>
);