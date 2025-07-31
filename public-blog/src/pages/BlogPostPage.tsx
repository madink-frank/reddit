import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button, Badge, BlogPostCard } from '@/components/ui';
import SEO from '@/components/SEO';
import CommentSection from '@/components/comments/CommentSection';
import apiClient from '@/services/api';
import type { BlogPost } from '@/services/api';

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  const [activeHeading, setActiveHeading] = useState<string>('');

  // Fetch blog post
  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setError('Post not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const postData = await apiClient.getBlogPost(slug);
        setPost(postData);

        // Fetch related posts based on tags
        if (postData.tags.length > 0) {
          try {
            const relatedResponse = await apiClient.getBlogPosts({
              ...(postData.tags[0] && { tag: postData.tags[0] }),
              pageSize: 4,
            });
            // Filter out current post
            const filtered = relatedResponse.posts.filter(p => p.id !== postData.id);
            setRelatedPosts(filtered.slice(0, 3));
          } catch (err) {
            console.error('Failed to fetch related posts:', err);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Generate table of contents from markdown content
  useEffect(() => {
    if (!post?.content) return;

    const headings: TableOfContentsItem[] = [];
    const lines = post.content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match && match[1] && match[2]) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        headings.push({ id, text, level });
      }
    });

    setTableOfContents(headings);
  }, [post?.content]);

  // Handle scroll to update active heading
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = tableOfContents.map(item => 
        document.getElementById(item.id)
      ).filter(Boolean);

      const currentHeading = headingElements.find(el => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      if (currentHeading) {
        setActiveHeading(currentHeading.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tableOfContents]);

  // Convert markdown to HTML (basic implementation)
  const renderMarkdown = (content: string) => {
    let html = content;
    
    // Headers with IDs for TOC
    tableOfContents.forEach(item => {
      const headerRegex = new RegExp(`^#{${item.level}}\\s+${item.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm');
      html = html.replace(headerRegex, `<h${item.level} id="${item.id}">${item.text}</h${item.level}>`);
    });
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Paragraphs
    html = html.split('\n\n').map(paragraph => {
      if (paragraph.trim() && !paragraph.startsWith('<h') && !paragraph.startsWith('<pre>')) {
        return `<p>${paragraph.trim()}</p>`;
      }
      return paragraph;
    }).join('\n\n');
    
    return html;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = post ? `Check out this article: ${post.title}` : '';

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    
    let shareLink = '';
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'reddit':
        shareLink = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
        break;
      default:
        return;
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // You could add a toast notification here
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded mb-8 w-1/4"></div>
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Post not found'}
          </h1>
          <p className="text-gray-600 mb-6">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/blog')}>
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        keywords={post.tags}
        {...(post.metadata.socialImage && { image: post.metadata.socialImage })}
        url={`/blog/${post.slug}`}
        type="article"
        publishedTime={post.publishedAt}
        modifiedTime={post.updatedAt}
        author={post.author}
        section={post.category}
        tags={post.tags}
        canonical={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${post.slug}`}
      />
      <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-gray-700">Home</Link></li>
              <li>/</li>
              <li><Link to="/blog" className="hover:text-gray-700">Blog</Link></li>
              <li>/</li>
              <li className="text-gray-900 truncate">{post.title}</li>
            </ol>
          </nav>

          {/* Category */}
          <div className="mb-4">
            <Link to={`/blog?category=${post.category}`}>
              <Badge variant="primary" className="hover:bg-blue-200 transition-colors">
                {post.category}
              </Badge>
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <span>By {post.author}</span>
            <span>•</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            <span>•</span>
            <span>{post.readingTime} min read</span>
            {post.featured && (
              <>
                <span>•</span>
                <Badge variant="secondary" size="sm">Featured</Badge>
              </>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <Link key={tag} to={`/blog?tag=${tag}`}>
                <Badge variant="outline" className="hover:bg-gray-100 transition-colors">
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Social Share */}
          <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Share:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('twitter')}
                className="text-blue-500 hover:bg-blue-50"
              >
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('facebook')}
                className="text-blue-600 hover:bg-blue-50"
              >
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('linkedin')}
                className="text-blue-700 hover:bg-blue-50"
              >
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('reddit')}
                className="text-orange-600 hover:bg-orange-50"
              >
                Reddit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="text-gray-600 hover:bg-gray-50"
              >
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Table of Contents - Sidebar */}
          {tableOfContents.length > 0 && (
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-8">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Table of Contents
                  </h3>
                  <nav>
                    <ul className="space-y-2">
                      {tableOfContents.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className={`block text-sm transition-colors ${
                              activeHeading === item.id
                                ? 'text-blue-600 font-medium'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById(item.id)?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            }}
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </div>
            </aside>
          )}

          {/* Article Content */}
          <main className="flex-1">
            <article className="bg-white rounded-lg shadow-sm border p-8 lg:p-12">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-pink-600 prose-code:bg-pink-50 prose-pre:bg-gray-900 prose-pre:text-gray-100"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
              />
            </article>

            {/* Article Footer */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Last updated: {new Date(post.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Share this article:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('twitter')}
                    >
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('linkedin')}
                    >
                      LinkedIn
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Comments Section */}
        <CommentSection
          postId={post.slug}
          postTitle={post.title}
          enabled={true}
        />

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Related Articles
              </h2>
              <p className="text-gray-600">
                Discover more content you might find interesting
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogPostCard
                  key={relatedPost.id}
                  post={relatedPost}
                  className="h-full"
                />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/blog">
                <Button variant="outline">
                  View All Articles
                </Button>
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
    </>
  );
};

export default BlogPostPage;