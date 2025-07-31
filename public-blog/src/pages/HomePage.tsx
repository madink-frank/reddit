import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { NewsletterSubscription } from '@/components/ui';
import apiClient, { type BlogPost, type CategoryResponse, type TagResponse } from '../services/api';

const HomePage: React.FC = () => {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<CategoryResponse['categories']>([]);
  const [popularTags, setPopularTags] = useState<TagResponse['tags']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [postsResponse, categoriesResponse, tagsResponse] = await Promise.all([
          apiClient.getBlogPosts({ pageSize: 6 }),
          apiClient.getCategories(),
          apiClient.getTags()
        ]);

        setRecentPosts(postsResponse.posts);
        setCategories(categoriesResponse.categories.slice(0, 6));
        setPopularTags(tagsResponse.tags.slice(0, 12));
      } catch (err) {
        console.error('Failed to fetch home data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Home"
        description="Discover trending topics and insights from Reddit communities through AI-powered content analysis. Stay ahead with the latest discussions and trends."
        keywords={['reddit trends', 'social media analysis', 'trending topics', 'community insights']}
        type="website"
        url="/"
      />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-blue-100 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover Reddit's
              <span className="text-blue-600 block">Trending Insights</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
              Stay ahead of the curve with AI-powered analysis of Reddit communities.
              Get the latest trends, discussions, and insights delivered through
              expertly crafted content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/blog">
                <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto">
                  Explore Latest Posts
                </button>
              </Link>
              <Link to="/about">
                <button className="px-8 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors w-full sm:w-auto">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest Insights
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Fresh analysis and trending topics from Reddit communities,
              curated and analyzed by our AI-powered platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {recentPosts.map((post) => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  <Link to={`/blog/${post.slug}`} className="hover:text-blue-600">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>By {post.author}</span>
                  <span>{post.readingTime} min read</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/blog">
              <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                View All Posts
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore content organized by the most discussed topics
              across Reddit communities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {categories.map((category) => (
              <Link key={category.slug} to={`/category/${category.slug}`}>
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {category.description || `Discover trending topics in ${category.name.toLowerCase()}`}
                  </p>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {category.count} posts
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tags Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trending Topics
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The most discussed keywords and topics across Reddit communities.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {popularTags.map((tag) => (
              <Link key={tag.slug} to={`/tag/${tag.slug}`}>
                <span className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer">
                  #{tag.name}
                  <span className="ml-2 text-xs text-gray-500">
                    {tag.count}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link to="/search">
              <button className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors">
                Explore All Topics →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <NewsletterSubscription
            variant="inline"
            showPreferences={true}
            availableCategories={categories}
            availableTags={popularTags}
            className="max-w-2xl mx-auto"
          />
        </div>
      </section>
    </div>
    </>
  );
};

export default HomePage;