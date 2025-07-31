/**
 * SEO Demo Component
 * Demonstrates the enhanced SEO features and structured data
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import SEO from '@/components/SEO';

interface SEODemoProps {
    className?: string;
}

const SEODemo: React.FC<SEODemoProps> = ({ className }) => {
    const [seoType, setSeoType] = useState<'website' | 'article'>('website');
    const [showStructuredData, setShowStructuredData] = useState(false);

    const websiteExample = {
        title: 'Reddit Content Platform Blog',
        description: 'Discover trending topics and insights from Reddit communities through AI-powered content analysis.',
        keywords: ['reddit', 'trends', 'social media', 'content analysis', 'AI'],
        type: 'website' as const
    };

    const articleExample = {
        title: 'The Rise of AI in Reddit Communities',
        description: 'Exploring how artificial intelligence is transforming Reddit discussions and community interactions.',
        keywords: ['AI', 'artificial intelligence', 'reddit', 'communities', 'technology'],
        type: 'article' as const,
        publishedTime: '2024-01-15T10:00:00Z',
        modifiedTime: '2024-01-15T12:00:00Z',
        author: 'Reddit Content Platform Team',
        section: 'Technology',
        tags: ['AI', 'Technology', 'Reddit', 'Communities'],
        url: '/blog/rise-of-ai-reddit-communities'
    };

    const currentExample = seoType === 'website' ? websiteExample : articleExample;

    const getStructuredDataPreview = () => {
        if (seoType === 'website') {
            return {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Reddit Content Platform Blog',
                description: 'Discover trending topics and insights from Reddit communities through AI-powered content analysis.',
                url: 'https://blog.redditcontentplatform.com',
                inLanguage: 'en-US',
                publisher: {
                    '@type': 'Organization',
                    name: 'Reddit Content Platform Blog',
                    url: 'https://blog.redditcontentplatform.com',
                    logo: {
                        '@type': 'ImageObject',
                        url: 'https://blog.redditcontentplatform.com/logo.png',
                        width: 144,
                        height: 144
                    }
                },
                potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                        '@type': 'EntryPoint',
                        urlTemplate: 'https://blog.redditcontentplatform.com/search?q={search_term_string}'
                    },
                    'query-input': 'required name=search_term_string'
                }
            };
        } else {
            return {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: 'The Rise of AI in Reddit Communities',
                description: 'Exploring how artificial intelligence is transforming Reddit discussions and community interactions.',
                image: {
                    '@type': 'ImageObject',
                    url: 'https://blog.redditcontentplatform.com/og-default.jpg',
                    width: 1200,
                    height: 630
                },
                author: {
                    '@type': 'Person',
                    name: 'Reddit Content Platform Team',
                    url: 'https://blog.redditcontentplatform.com/about'
                },
                publisher: {
                    '@type': 'Organization',
                    name: 'Reddit Content Platform Blog',
                    url: 'https://blog.redditcontentplatform.com',
                    logo: {
                        '@type': 'ImageObject',
                        url: 'https://blog.redditcontentplatform.com/logo.png',
                        width: 144,
                        height: 144
                    }
                },
                datePublished: '2024-01-15T10:00:00Z',
                dateModified: '2024-01-15T12:00:00Z',
                mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': 'https://blog.redditcontentplatform.com/blog/rise-of-ai-reddit-communities'
                },
                keywords: 'AI, artificial intelligence, reddit, communities, technology',
                articleSection: 'Technology',
                wordCount: 150,
                inLanguage: 'en-US',
                isAccessibleForFree: true
            };
        }
    };

    return (
        <div className={className}>
            {/* SEO Component Demo */}
            <SEO {...currentExample} />

            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    SEO & Structured Data Demo
                </h2>

                <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                        This page demonstrates the enhanced SEO features including meta tags, Open Graph, Twitter Cards, and JSON-LD structured data.
                    </p>

                    <div className="flex gap-4 mb-4">
                        <Button
                            variant={seoType === 'website' ? 'primary' : 'outline'}
                            onClick={() => setSeoType('website')}
                        >
                            Website SEO
                        </Button>
                        <Button
                            variant={seoType === 'article' ? 'primary' : 'outline'}
                            onClick={() => setSeoType('article')}
                        >
                            Article SEO
                        </Button>
                    </div>
                </div>

                {/* SEO Features List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Meta Tags</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>✓ Title and description optimization</li>
                            <li>✓ Keywords meta tag</li>
                            <li>✓ Author information</li>
                            <li>✓ Canonical URLs</li>
                            <li>✓ Robots directives</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Social Media</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>✓ Open Graph tags (Facebook)</li>
                            <li>✓ Twitter Card tags</li>
                            <li>✓ Social media images</li>
                            <li>✓ Rich snippets support</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Structured Data</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>✓ JSON-LD format</li>
                            <li>✓ Article schema</li>
                            <li>✓ Organization schema</li>
                            <li>✓ Breadcrumb navigation</li>
                            <li>✓ Search action schema</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Feed Links</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>✓ RSS 2.0 feed links</li>
                            <li>✓ Atom 1.0 feed links</li>
                            <li>✓ JSON Feed links</li>
                            <li>✓ Sitemap references</li>
                        </ul>
                    </div>
                </div>

                {/* Structured Data Preview */}
                <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">JSON-LD Structured Data</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowStructuredData(!showStructuredData)}
                        >
                            {showStructuredData ? 'Hide' : 'Show'} JSON-LD
                        </Button>
                    </div>

                    {showStructuredData && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <pre className="text-xs text-gray-700 overflow-x-auto max-h-96">
                                {JSON.stringify(getStructuredDataPreview(), null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Testing Tools */}
                <div className="border-t pt-6 mt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">SEO Testing Tools</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <a
                            href="https://search.google.com/test/rich-results"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                            <div className="text-blue-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">Rich Results Test</div>
                                <div className="text-sm text-gray-600">Google's structured data testing tool</div>
                            </div>
                        </a>

                        <a
                            href="https://developers.facebook.com/tools/debug/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                            <div className="text-blue-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">Facebook Debugger</div>
                                <div className="text-sm text-gray-600">Test Open Graph tags</div>
                            </div>
                        </a>

                        <a
                            href="https://cards-dev.twitter.com/validator"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                            <div className="text-blue-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">Twitter Card Validator</div>
                                <div className="text-sm text-gray-600">Test Twitter Card tags</div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SEODemo;