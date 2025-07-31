/**
 * Feed Subscription Component
 * Displays RSS, Atom, and JSON feed subscription options
 */

import React, { useState } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import feedService from '@/services/feedService';

interface FeedSubscriptionProps {
  className?: string;
  showTitle?: boolean;
  variant?: 'default' | 'compact' | 'dropdown';
}

const FeedSubscription: React.FC<FeedSubscriptionProps> = ({
  className,
  showTitle = true,
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const feedMetadata = feedService.getFeedMetadata();

  const feedLinks = [
    {
      type: 'RSS',
      url: feedMetadata.rss,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248S0 22.546 0 20.752s1.456-3.248 3.252-3.248 3.251 1.454 3.251 3.248zM1.677 6.082v4.15c6.988 0 12.65 5.662 12.65 12.65h4.15c0-9.271-7.529-16.8-16.8-16.8zM1.677.014v4.151C14.236 4.165 24.322 14.251 24.336 26.81H28.487C28.473 12.32 16.168.009 1.677.014z"/>
        </svg>
      ),
      description: 'RSS 2.0 feed for feed readers'
    },
    {
      type: 'Atom',
      url: feedMetadata.atom,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.199 24C8.836 24 .199 15.363.199 5S8.836-14 19.199-14s19 8.637 19 19-8.637 19-19 19zm0-35c-8.836 0-16 7.164-16 16s7.164 16 16 16 16-7.164 16-16-7.164-16-16-16z"/>
          <circle cx="19.199" cy="5" r="3"/>
        </svg>
      ),
      description: 'Atom 1.0 feed for modern readers'
    },
    {
      type: 'JSON',
      url: feedMetadata.json,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5.843 8.195L9.56 12l-3.717 3.805L7 17l5-5-5-5-1.157 1.195zM17 17h-3v-2h3v2z"/>
        </svg>
      ),
      description: 'JSON feed for modern applications'
    }
  ];

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {feedLinks.map((feed) => (
          <a
            key={feed.type}
            href={feed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title={feed.description}
          >
            {feed.icon}
            {feed.type}
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248S0 22.546 0 20.752s1.456-3.248 3.252-3.248 3.251 1.454 3.251 3.248zM1.677 6.082v4.15c6.988 0 12.65 5.662 12.65 12.65h4.15c0-9.271-7.529-16.8-16.8-16.8zM1.677.014v4.151C14.236 4.165 24.322 14.251 24.336 26.81H28.487C28.473 12.32 16.168.009 1.677.014z"/>
          </svg>
          Subscribe
          <svg className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="p-3 border-b border-gray-100">
              <h4 className="font-medium text-gray-900">Subscribe to our feeds</h4>
              <p className="text-xs text-gray-600 mt-1">Stay updated with our latest posts</p>
            </div>
            <div className="p-2">
              {feedLinks.map((feed) => (
                <a
                  key={feed.type}
                  href={feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="text-gray-400">
                    {feed.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{feed.type} Feed</div>
                    <div className="text-xs text-gray-600">{feed.description}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('bg-white rounded-lg border p-6', className)}>
      {showTitle && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscribe to Updates</h3>
          <p className="text-gray-600 text-sm">
            Stay updated with our latest posts through your favorite feed reader.
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        {feedLinks.map((feed) => (
          <a
            key={feed.type}
            href={feed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div className="text-gray-400 group-hover:text-blue-600">
              {feed.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 group-hover:text-blue-900">
                {feed.type} Feed
              </div>
              <div className="text-sm text-gray-600 group-hover:text-blue-700">
                {feed.description}
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Don't know what RSS is? Learn more about{' '}
          <a 
            href="https://en.wikipedia.org/wiki/RSS" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            RSS feeds
          </a>{' '}
          and how to use them.
        </p>
      </div>
    </div>
  );
};

export default FeedSubscription;