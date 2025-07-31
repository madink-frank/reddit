import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { cn } from '../../lib/utils';
import type { BlogPost } from '@/services/api';

interface SearchResultCardProps {
  post: BlogPost;
  searchQuery?: string;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  className?: string;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({
  post,
  searchQuery,
  onTagClick,
  onCategoryClick,
  className,
}) => {
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

  // Highlight search terms in text
  const highlightText = (text: string, searchTerm?: string) => {
    if (!searchTerm?.trim()) return <span>{text}</span>;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <Card
      as="article"
      hover={true}
      className={cn(
        'group overflow-hidden cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:border-blue-200',
        className
      )}
      onClick={() => window.location.href = href}
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

      {/* Title with highlighting */}
      <CardHeader className="mb-3 p-0">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {highlightText(post.title, searchQuery)}
        </h3>
      </CardHeader>
      
      {/* Excerpt with highlighting */}
      <CardContent className="mb-4 p-0">
        <div className="text-gray-600 line-clamp-3 text-sm leading-relaxed">
          {highlightText(post.excerpt, searchQuery)}
        </div>
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
};

export default SearchResultCard;