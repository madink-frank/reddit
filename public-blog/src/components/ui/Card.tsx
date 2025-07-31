import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  as?: React.ElementType;
}

const cardVariants = {
  default: 'bg-surface border border-default shadow-card',
  elevated: 'bg-surface-elevated shadow-elevated border border-secondary',
  outlined: 'bg-surface border-2 border-default shadow-none',
  ghost: 'bg-transparent border-none shadow-none',
};

const cardPadding = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md',
    hover = false,
    as: Component = 'div',
    children,
    ...props 
  }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          // Base styles
          'rounded-lg transition-default',
          // Variant styles
          cardVariants[variant],
          // Padding styles
          cardPadding[padding],
          // Hover effect
          hover && 'hover:shadow-card-hover hover:-translate-y-1',
          // Custom className
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// Card Header component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between mb-4', className)}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-primary mb-1 truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-secondary truncate">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && (
          <div className="flex-shrink-0 ml-4">
            {action}
          </div>
        )}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('text-secondary', className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: 'start' | 'center' | 'end' | 'between';
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, justify = 'start', ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 mt-4 pt-4 border-t border-secondary',
          justifyClasses[justify],
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

// Blog Post Card - specialized card for blog posts
export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  category: string;
  readingTime: number;
  featured: boolean;
  metadata: {
    seoTitle?: string;
    seoDescription?: string;
    socialImage?: string;
  };
}

export interface BlogPostCardProps extends Omit<CardProps, 'children'> {
  post: BlogPost;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
}

export const BlogPostCard = React.forwardRef<HTMLDivElement, BlogPostCardProps>(
  ({ 
    post,
    onTagClick,
    onCategoryClick,
    className,
    ...props 
  }, ref) => {
    const href = `/blog/${post.slug}`;
    
    const formatReadingTime = (minutes: number) => {
      return `${minutes} min read`;
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    return (
      <Card
        ref={ref}
        as="article"
        hover={true}
        className={cn(
          'group overflow-hidden cursor-pointer transition-all duration-200',
          'hover:shadow-lg hover:border-blue-200',
          className
        )}
        onClick={() => window.location.href = href}
        {...props}
      >
        {/* Featured Badge */}
        {post.featured && (
          <div className="absolute top-4 right-4 z-10">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
              Featured
            </span>
          </div>
        )}

        {/* Social Image */}
        {post.metadata.socialImage && (
          <div className="aspect-video overflow-hidden rounded-t-lg -m-6 mb-4 relative">
            <img
              src={post.metadata.socialImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="mb-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCategoryClick?.(post.category);
            }}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
          >
            {post.category}
          </button>
        </div>

        {/* Title */}
        <CardHeader className="mb-3 p-0">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </CardHeader>
        
        {/* Excerpt */}
        <CardContent className="mb-4 p-0">
          <p className="text-gray-600 line-clamp-3 text-sm leading-relaxed">
            {post.excerpt}
          </p>
        </CardContent>
        
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </button>
            ))}
            {post.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-gray-500">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* Footer */}
        <CardFooter justify="between" className="text-xs text-gray-500 pt-4 border-t border-gray-100 p-0 mt-4">
          <div className="flex items-center gap-2">
            <span>By {post.author}</span>
            <span>•</span>
            <span>{formatReadingTime(post.readingTime)}</span>
          </div>
          <time dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
        </CardFooter>
      </Card>
    );
  }
);

BlogPostCard.displayName = 'BlogPostCard';