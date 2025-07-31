/**
 * Feed Service for RSS, Atom, and Sitemap generation
 */

import apiClient from './api';
import { 
  generateRSSFeed, 
  generateAtomFeed, 
  generateJSONFeed, 
  blogPostToRSSItem,
  type RSSFeedOptions 
} from '@/utils/rss';
import { 
  generateEnhancedRSSFeed,
  generateEnhancedAtomFeed,
  generateEnhancedJSONFeed,
  blogPostToEnhancedRSSItem,
  generateCategoryRSSFeed,
  generateTagRSSFeed
} from '@/utils/rss-enhanced';
import { 
  SitemapGenerator,
  generateBlogSitemapUrls,
  generateAndSaveSitemaps,
  type SitemapOptions 
} from '@/utils/sitemap';

export class FeedService {
  private baseUrl: string;
  private feedOptions: RSSFeedOptions;
  private sitemapOptions: SitemapOptions;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://your-blog-domain.com'; // Replace with actual domain

    this.feedOptions = {
      title: 'Reddit Content Platform Blog',
      description: 'Discover trending topics and insights from Reddit communities through AI-powered content analysis.',
      link: this.baseUrl,
      language: 'en-us',
      copyright: `© ${new Date().getFullYear()} Reddit Content Platform`,
      managingEditor: 'team@redditcontentplatform.com',
      webMaster: 'webmaster@redditcontentplatform.com',
      category: 'Technology',
      generator: 'Reddit Content Platform Blog'
    };

    this.sitemapOptions = {
      baseUrl: this.baseUrl,
      defaultChangefreq: 'weekly',
      defaultPriority: 0.7
    };
  }

  /**
   * Generate RSS 2.0 feed
   */
  async generateRSS(limit: number = 50): Promise<string> {
    try {
      const response = await apiClient.getBlogPosts({ 
        pageSize: limit,
        page: 1 
      });
      
      const rssItems = response.posts.map(post => 
        blogPostToRSSItem(post, this.baseUrl)
      );

      return generateRSSFeed(this.feedOptions, rssItems);
    } catch (error) {
      console.error('Failed to generate RSS feed:', error);
      throw new Error('RSS feed generation failed');
    }
  }

  /**
   * Generate Atom 1.0 feed
   */
  async generateAtom(limit: number = 50): Promise<string> {
    try {
      const response = await apiClient.getBlogPosts({ 
        pageSize: limit,
        page: 1 
      });
      
      const rssItems = response.posts.map(post => 
        blogPostToRSSItem(post, this.baseUrl)
      );

      return generateAtomFeed(this.feedOptions, rssItems);
    } catch (error) {
      console.error('Failed to generate Atom feed:', error);
      throw new Error('Atom feed generation failed');
    }
  }

  /**
   * Generate JSON Feed
   */
  async generateJSON(limit: number = 50): Promise<string> {
    try {
      const response = await apiClient.getBlogPosts({ 
        pageSize: limit,
        page: 1 
      });
      
      const rssItems = response.posts.map(post => 
        blogPostToRSSItem(post, this.baseUrl)
      );

      return generateJSONFeed(this.feedOptions, rssItems);
    } catch (error) {
      console.error('Failed to generate JSON feed:', error);
      throw new Error('JSON feed generation failed');
    }
  }

  /**
   * Generate complete sitemap
   */
  async generateSitemapXML(): Promise<string> {
    try {
      // Fetch all necessary data
      const [postsResponse, categoriesResponse, tagsResponse] = await Promise.all([
        apiClient.getBlogPosts({ pageSize: 1000, page: 1 }), // Get all posts
        apiClient.getCategories(),
        apiClient.getTags()
      ]);

      // Generate URLs for different types of pages
      const generator = new SitemapGenerator({ baseUrl: this.sitemapOptions.baseUrl });
      const blogUrls = await generateBlogSitemapUrls(this.sitemapOptions.baseUrl);

      return generator.generateXML(blogUrls);
    } catch (error) {
      console.error('Failed to generate sitemap:', error);
      throw new Error('Sitemap generation failed');
    }
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt(): string {
    return generateRobotsTxt(this.baseUrl);
  }

  /**
   * Get feed metadata for HTML head
   */
  getFeedMetadata() {
    return {
      rss: `${this.baseUrl}/rss.xml`,
      atom: `${this.baseUrl}/atom.xml`,
      json: `${this.baseUrl}/feed.json`,
      sitemap: `${this.baseUrl}/sitemap.xml`
    };
  }

  /**
   * Generate enhanced RSS 2.0 feed with full content
   */
  async generateEnhancedRSS(limit: number = 50): Promise<string> {
    try {
      const response = await apiClient.getBlogPosts({ 
        pageSize: limit,
        page: 1 
      });
      
      const rssItems = response.posts.map(post => 
        blogPostToEnhancedRSSItem(post, this.baseUrl)
      );

      return generateEnhancedRSSFeed(this.feedOptions, rssItems);
    } catch (error) {
      console.error('Failed to generate enhanced RSS feed:', error);
      throw new Error('Enhanced RSS feed generation failed');
    }
  }

  /**
   * Generate enhanced Atom 1.0 feed
   */
  async generateEnhancedAtom(limit: number = 50): Promise<string> {
    try {
      const response = await apiClient.getBlogPosts({ 
        pageSize: limit,
        page: 1 
      });
      
      const rssItems = response.posts.map(post => 
        blogPostToEnhancedRSSItem(post, this.baseUrl)
      );

      return generateEnhancedAtomFeed(this.feedOptions, rssItems);
    } catch (error) {
      console.error('Failed to generate enhanced Atom feed:', error);
      throw new Error('Enhanced Atom feed generation failed');
    }
  }

  /**
   * Generate enhanced JSON Feed
   */
  async generateEnhancedJSON(limit: number = 50): Promise<string> {
    try {
      const response = await apiClient.getBlogPosts({ 
        pageSize: limit,
        page: 1 
      });
      
      const rssItems = response.posts.map(post => 
        blogPostToEnhancedRSSItem(post, this.baseUrl)
      );

      return generateEnhancedJSONFeed(this.feedOptions, rssItems);
    } catch (error) {
      console.error('Failed to generate enhanced JSON feed:', error);
      throw new Error('Enhanced JSON feed generation failed');
    }
  }

  /**
   * Generate category-specific RSS feed
   */
  async generateCategoryRSS(category: string, limit: number = 20): Promise<string> {
    try {
      const response = await apiClient.getBlogPosts({ 
        category,
        pageSize: limit,
        page: 1 
      });
      
      return generateCategoryRSSFeed(category, response.posts, this.baseUrl);
    } catch (error) {
      console.error(`Failed to generate RSS feed for category ${category}:`, error);
      throw new Error('Category RSS feed generation failed');
    }
  }

  /**
   * Generate tag-specific RSS feed
   */
  async generateTagRSS(tag: string, limit: number = 20): Promise<string> {
    try {
      const response = await apiClient.getBlogPosts({ 
        tag,
        pageSize: limit,
        page: 1 
      });
      
      return generateTagRSSFeed(tag, response.posts, this.baseUrl);
    } catch (error) {
      console.error(`Failed to generate RSS feed for tag ${tag}:`, error);
      throw new Error('Tag RSS feed generation failed');
    }
  }

  /**
   * Generate comprehensive sitemap with all enhancements
   */
  async generateComprehensiveSitemapXML(): Promise<string> {
    try {
      const [postsResponse, categoriesResponse, tagsResponse] = await Promise.all([
        apiClient.getBlogPosts({ pageSize: 1000, page: 1 }),
        apiClient.getCategories(),
        apiClient.getTags()
      ]);

      return generateComprehensiveSitemap(
        postsResponse.posts,
        categoriesResponse.categories,
        tagsResponse.tags,
        this.sitemapOptions
      );
    } catch (error) {
      console.error('Failed to generate comprehensive sitemap:', error);
      throw new Error('Comprehensive sitemap generation failed');
    }
  }

  /**
   * Generate news sitemap for recent posts
   */
  async generateNewsSitemapXML(): Promise<string> {
    try {
      const response = await apiClient.getBlogPosts({ pageSize: 100, page: 1 });
      return generateNewsSitemap(response.posts, this.sitemapOptions);
    } catch (error) {
      console.error('Failed to generate news sitemap:', error);
      throw new Error('News sitemap generation failed');
    }
  }

  /**
   * Generate image sitemap
   */
  async generateImageSitemapXML(): Promise<string> {
    try {
      const response = await apiClient.getBlogPosts({ pageSize: 1000, page: 1 });
      return generateImageSitemap(response.posts, this.sitemapOptions);
    } catch (error) {
      console.error('Failed to generate image sitemap:', error);
      throw new Error('Image sitemap generation failed');
    }
  }

  /**
   * Generate sitemap index
   */
  async generateSitemapIndexXML(): Promise<string> {
    try {
      const now = new Date().toISOString().split('T')[0];
      const sitemaps = [
        { loc: `${this.baseUrl}/sitemap.xml`, lastmod: now },
        { loc: `${this.baseUrl}/sitemap-posts.xml`, lastmod: now },
        { loc: `${this.baseUrl}/sitemap-categories.xml`, lastmod: now },
        { loc: `${this.baseUrl}/sitemap-tags.xml`, lastmod: now },
        { loc: `${this.baseUrl}/sitemap-news.xml`, lastmod: now },
        { loc: `${this.baseUrl}/sitemap-images.xml`, lastmod: now }
      ] as Array<{ loc: string; lastmod?: string }>;

      const generator = new SitemapGenerator({ baseUrl: this.baseUrl });
      return generator.generateSitemapIndex(sitemaps);
    } catch (error) {
      console.error('Failed to generate sitemap index:', error);
      throw new Error('Sitemap index generation failed');
    }
  }

  /**
   * Download feed as file (for development/testing)
   */
  async downloadFeed(type: 'rss' | 'atom' | 'json' | 'sitemap' | 'robots' | 'enhanced-rss' | 'enhanced-atom' | 'enhanced-json' | 'news-sitemap' | 'image-sitemap' | 'sitemap-index') {
    let content: string;
    let filename: string;
    let mimeType: string;

    try {
      switch (type) {
        case 'rss':
          content = await this.generateRSS();
          filename = 'rss.xml';
          mimeType = 'application/rss+xml';
          break;
        case 'atom':
          content = await this.generateAtom();
          filename = 'atom.xml';
          mimeType = 'application/atom+xml';
          break;
        case 'json':
          content = await this.generateJSON();
          filename = 'feed.json';
          mimeType = 'application/json';
          break;
        case 'enhanced-rss':
          content = await this.generateEnhancedRSS();
          filename = 'enhanced-rss.xml';
          mimeType = 'application/rss+xml';
          break;
        case 'enhanced-atom':
          content = await this.generateEnhancedAtom();
          filename = 'enhanced-atom.xml';
          mimeType = 'application/atom+xml';
          break;
        case 'enhanced-json':
          content = await this.generateEnhancedJSON();
          filename = 'enhanced-feed.json';
          mimeType = 'application/json';
          break;
        case 'sitemap':
          content = await this.generateSitemapXML();
          filename = 'sitemap.xml';
          mimeType = 'application/xml';
          break;
        case 'news-sitemap':
          content = await this.generateNewsSitemapXML();
          filename = 'sitemap-news.xml';
          mimeType = 'application/xml';
          break;
        case 'image-sitemap':
          content = await this.generateImageSitemapXML();
          filename = 'sitemap-images.xml';
          mimeType = 'application/xml';
          break;
        case 'sitemap-index':
          content = await this.generateSitemapIndexXML();
          filename = 'sitemap-index.xml';
          mimeType = 'application/xml';
          break;
        case 'robots':
          content = this.generateRobotsTxt();
          filename = 'robots.txt';
          mimeType = 'text/plain';
          break;
        default:
          throw new Error('Invalid feed type');
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to download ${type} feed:`, error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const feedService = new FeedService();
export default feedService;