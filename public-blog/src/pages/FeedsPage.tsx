/**
 * Feeds Demo Page - For testing RSS, Atom, JSON feeds and sitemap generation
 * This page is for development/testing purposes
 */

import React, { useState } from 'react';
import { Button, FeedSubscription } from '@/components/ui';
import SEODemo from '@/components/SEODemo';
import feedService from '@/services/feedService';

const FeedsPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateFeed = async (type: 'rss' | 'atom' | 'json' | 'sitemap' | 'robots' | 'enhanced-rss' | 'enhanced-atom' | 'enhanced-json' | 'news-sitemap' | 'image-sitemap' | 'sitemap-index') => {
    setLoading(type);
    setError(null);
    setResult(null);

    try {
      let content: string;
      
      switch (type) {
        case 'rss':
          content = await feedService.generateRSS(10);
          break;
        case 'enhanced-rss':
          content = await feedService.generateEnhancedRSS(10);
          break;
        case 'atom':
          content = await feedService.generateAtom(10);
          break;
        case 'enhanced-atom':
          content = await feedService.generateEnhancedAtom(10);
          break;
        case 'json':
          content = await feedService.generateJSON(10);
          break;
        case 'enhanced-json':
          content = await feedService.generateEnhancedJSON(10);
          break;
        case 'sitemap':
          content = await feedService.generateSitemapXML();
          break;
        case 'news-sitemap':
          content = await feedService.generateNewsSitemapXML();
          break;
        case 'image-sitemap':
          content = await feedService.generateImageSitemapXML();
          break;
        case 'sitemap-index':
          content = await feedService.generateSitemapIndexXML();
          break;
        case 'robots':
          content = feedService.generateRobotsTxt();
          break;
        default:
          throw new Error('Invalid feed type');
      }

      setResult(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = async (type: 'rss' | 'atom' | 'json' | 'sitemap' | 'robots' | 'enhanced-rss' | 'enhanced-atom' | 'enhanced-json' | 'news-sitemap' | 'image-sitemap' | 'sitemap-index') => {
    try {
      await feedService.downloadFeed(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const feedTypes = [
    {
      type: 'rss' as const,
      name: 'RSS 2.0',
      description: 'RSS 2.0 XML feed for feed readers',
      mimeType: 'application/rss+xml'
    },
    {
      type: 'enhanced-rss' as const,
      name: 'Enhanced RSS 2.0',
      description: 'Enhanced RSS with full content and SEO optimization',
      mimeType: 'application/rss+xml'
    },
    {
      type: 'atom' as const,
      name: 'Atom 1.0',
      description: 'Atom 1.0 XML feed for modern readers',
      mimeType: 'application/atom+xml'
    },
    {
      type: 'enhanced-atom' as const,
      name: 'Enhanced Atom 1.0',
      description: 'Enhanced Atom feed with full content',
      mimeType: 'application/atom+xml'
    },
    {
      type: 'json' as const,
      name: 'JSON Feed',
      description: 'JSON feed for modern applications',
      mimeType: 'application/json'
    },
    {
      type: 'enhanced-json' as const,
      name: 'Enhanced JSON Feed',
      description: 'Enhanced JSON Feed 1.1 with full content',
      mimeType: 'application/json'
    },
    {
      type: 'sitemap' as const,
      name: 'XML Sitemap',
      description: 'XML sitemap for search engines',
      mimeType: 'application/xml'
    },
    {
      type: 'news-sitemap' as const,
      name: 'News Sitemap',
      description: 'Google News sitemap for recent posts',
      mimeType: 'application/xml'
    },
    {
      type: 'image-sitemap' as const,
      name: 'Image Sitemap',
      description: 'Sitemap for images in posts',
      mimeType: 'application/xml'
    },
    {
      type: 'sitemap-index' as const,
      name: 'Sitemap Index',
      description: 'Index of all sitemaps',
      mimeType: 'application/xml'
    },
    {
      type: 'robots' as const,
      name: 'Robots.txt',
      description: 'Enhanced robots.txt with SEO directives',
      mimeType: 'text/plain'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Feeds & SEO Tools
          </h1>
          <p className="text-lg text-gray-600">
            Test and generate RSS feeds, sitemaps, and other SEO-related files.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed Generation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Feed Generation
              </h2>
              <p className="text-gray-600 mb-6">
                Generate and preview different types of feeds and SEO files.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {feedTypes.map((feed) => (
                  <div key={feed.type} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{feed.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{feed.description}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateFeed(feed.type)}
                        disabled={loading === feed.type}
                      >
                        {loading === feed.type ? 'Generating...' : 'Generate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(feed.type)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Result Display */}
              {result && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Generated Content</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(result)}
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs text-gray-700 overflow-x-auto max-h-96 bg-white p-4 rounded border">
                    {result}
                  </pre>
                </div>
              )}
            </div>

            {/* Feed Metadata */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Feed URLs
              </h2>
              <p className="text-gray-600 mb-4">
                These are the URLs where feeds would be available in production.
              </p>
              
              <div className="space-y-3">
                {Object.entries(feedService.getFeedMetadata()).map(([type, url]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 capitalize">{type}</span>
                      <div className="text-sm text-gray-600">{url}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(url)}
                    >
                      Copy URL
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Feed Subscription Component Demo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Subscription Component
              </h3>
              <FeedSubscription />
            </div>

            {/* Compact Version */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Compact Version
              </h3>
              <div className="bg-white p-4 rounded-lg border">
                <FeedSubscription variant="compact" />
              </div>
            </div>

            {/* Dropdown Version */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Dropdown Version
              </h3>
              <div className="bg-white p-4 rounded-lg border">
                <FeedSubscription variant="dropdown" />
              </div>
            </div>

            {/* SEO Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Enhanced SEO Features</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Enhanced meta tags optimization</li>
                <li>✓ Open Graph tags with rich data</li>
                <li>✓ Twitter Card tags</li>
                <li>✓ JSON-LD structured data (Article, Organization, Breadcrumbs)</li>
                <li>✓ Enhanced RSS/Atom feeds with full content</li>
                <li>✓ Canonical URLs</li>
                <li>✓ Comprehensive XML sitemaps</li>
                <li>✓ News sitemap for Google News</li>
                <li>✓ Image sitemap</li>
                <li>✓ Enhanced robots.txt with AI bot controls</li>
                <li>✓ Category and tag-specific feeds</li>
                <li>✓ JSON Feed 1.1 support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SEO Demo Section */}
        <div className="mt-8">
          <SEODemo />
        </div>
      </div>
    </div>
  );
};

export default FeedsPage;