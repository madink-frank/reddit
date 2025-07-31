/**
 * Enhanced sitemap generation utilities
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{
    hreflang: string;
    href: string;
  }>;
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
  news?: {
    publication: {
      name: string;
      language: string;
    };
    publication_date: string;
    title: string;
    keywords?: string;
  };
}

export interface SitemapOptions {
  baseUrl: string;
  defaultChangefreq?: SitemapUrl['changefreq'];
  defaultPriority?: number;
  includeImages?: boolean;
  includeNews?: boolean;
  includeAlternates?: boolean;
}

export class SitemapGenerator {
  private options: Required<SitemapOptions>;

  constructor(options: SitemapOptions) {
    this.options = {
      defaultChangefreq: 'weekly',
      defaultPriority: 0.5,
      includeImages: true,
      includeNews: false,
      includeAlternates: true,
      ...options
    };
  }

  /**
   * Generate XML sitemap from URLs
   */
  generateXML(urls: SitemapUrl[]): string {
    const urlElements = urls.map(url => this.generateUrlElement(url)).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements}
</urlset>`;
  }

  /**
   * Generate sitemap index XML
   */
  generateSitemapIndex(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
    const sitemapElements = sitemaps.map(sitemap => `  <sitemap>
    <loc>${this.escapeXml(sitemap.loc)}</loc>
    ${sitemap.lastmod ? `<lastmod>${sitemap.lastmod}</lastmod>` : ''}
  </sitemap>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapElements}
</sitemapindex>`;
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(sitemapUrl: string, additionalRules: string[] = []): string {
    const rules = [
      'User-agent: *',
      'Allow: /',
      '',
      '# Disallow admin and private areas',
      'Disallow: /admin/',
      'Disallow: /api/',
      'Disallow: /private/',
      '',
      '# Allow search engines to crawl CSS and JS',
      'Allow: /assets/',
      'Allow: /*.css$',
      'Allow: /*.js$',
      '',
      ...additionalRules,
      '',
      `Sitemap: ${sitemapUrl}`
    ];

    return rules.join('\n');
  }

  /**
   * Generate URL element for sitemap
   */
  private generateUrlElement(url: SitemapUrl): string {
    const {
      loc,
      lastmod,
      changefreq = this.options.defaultChangefreq,
      priority = this.options.defaultPriority,
      alternates = [],
      images = [],
      news
    } = url;

    let urlElement = `  <url>
    <loc>${this.escapeXml(this.normalizeUrl(loc))}</loc>`;

    if (lastmod) {
      urlElement += `\n    <lastmod>${lastmod}</lastmod>`;
    }

    if (changefreq) {
      urlElement += `\n    <changefreq>${changefreq}</changefreq>`;
    }

    if (priority !== undefined) {
      urlElement += `\n    <priority>${priority.toFixed(1)}</priority>`;
    }

    // Add alternate language versions
    if (this.options.includeAlternates && alternates.length > 0) {
      alternates.forEach(alternate => {
        urlElement += `\n    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${this.escapeXml(this.normalizeUrl(alternate.href))}" />`;
      });
    }

    // Add images
    if (this.options.includeImages && images.length > 0) {
      images.forEach(image => {
        urlElement += `\n    <image:image>
      <image:loc>${this.escapeXml(this.normalizeUrl(image.loc))}</image:loc>`;
        
        if (image.caption) {
          urlElement += `\n      <image:caption>${this.escapeXml(image.caption)}</image:caption>`;
        }
        
        if (image.title) {
          urlElement += `\n      <image:title>${this.escapeXml(image.title)}</image:title>`;
        }
        
        urlElement += '\n    </image:image>';
      });
    }

    // Add news information
    if (this.options.includeNews && news) {
      urlElement += `\n    <news:news>
      <news:publication>
        <news:name>${this.escapeXml(news.publication.name)}</news:name>
        <news:language>${news.publication.language}</news:language>
      </news:publication>
      <news:publication_date>${news.publication_date}</news:publication_date>
      <news:title>${this.escapeXml(news.title)}</news:title>`;
      
      if (news.keywords) {
        urlElement += `\n      <news:keywords>${this.escapeXml(news.keywords)}</news:keywords>`;
      }
      
      urlElement += '\n    </news:news>';
    }

    urlElement += '\n  </url>';
    return urlElement;
  }

  /**
   * Normalize URL to absolute URL
   */
  private normalizeUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    
    const baseUrl = this.options.baseUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    
    return `${baseUrl}${path}`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * Generate blog-specific sitemap URLs
 */
export async function generateBlogSitemapUrls(baseUrl: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];
  
  // Static pages
  const staticPages = [
    { path: '/', priority: 1.0, changefreq: 'daily' as const },
    { path: '/blog', priority: 0.9, changefreq: 'daily' as const },
    { path: '/about', priority: 0.7, changefreq: 'monthly' as const },
    { path: '/search', priority: 0.6, changefreq: 'weekly' as const },
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: page.path,
      priority: page.priority,
      changefreq: page.changefreq,
      lastmod: new Date().toISOString().split('T')[0]
    });
  });

  // TODO: Add dynamic blog posts, categories, and tags
  // This would typically fetch from your API or CMS
  
  return urls;
}

/**
 * Generate and save sitemap files
 */
export async function generateAndSaveSitemaps(baseUrl: string, outputDir: string): Promise<void> {
  const generator = new SitemapGenerator({ baseUrl });
  
  // Generate main sitemap
  const urls = await generateBlogSitemapUrls(baseUrl);
  const sitemapXml = generator.generateXML(urls);
  
  // Generate robots.txt
  const robotsTxt = generator.generateRobotsTxt(`${baseUrl}/sitemap.xml`, [
    '# Custom rules for blog',
    'Crawl-delay: 1'
  ]);

  // In a real implementation, you would save these files
  console.log('Generated sitemap.xml:', sitemapXml.length, 'characters');
  console.log('Generated robots.txt:', robotsTxt.length, 'characters');
  
  return Promise.resolve();
}

export default SitemapGenerator;