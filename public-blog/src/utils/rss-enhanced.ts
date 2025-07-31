/**
 * Enhanced RSS Feed Generation Utilities
 * Improved version with better SEO optimization and standards compliance
 */

import type { BlogPost } from '@/services/api';

export interface RSSFeedOptions {
  title: string;
  description: string;
  link: string;
  language?: string;
  copyright?: string;
  managingEditor?: string;
  webMaster?: string;
  category?: string;
  generator?: string;
  ttl?: number; // Time to live in minutes
}

export interface RSSItem {
  title: string;
  description: string;
  content?: string; // Full content for content:encoded
  link: string;
  guid: string;
  pubDate: string;
  author?: string;
  category?: string[];
  enclosure?: {
    url: string;
    type: string;
    length: number;
  };
  keywords?: string[];
}

/**
 * Enhanced RSS 2.0 XML feed generation with better SEO
 */
export function generateEnhancedRSSFeed(options: RSSFeedOptions, items: RSSItem[]): string {
  const {
    title,
    description,
    link,
    language = 'en-us',
    copyright,
    managingEditor,
    webMaster,
    category,
    generator = 'Reddit Content Platform Blog',
    ttl = 60
  } = options;

  const now = new Date().toUTCString();
  const buildDate = new Date().toUTCString();

  const rssItems = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      ${item.content ? `<content:encoded><![CDATA[${item.content}]]></content:encoded>` : ''}
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      ${item.author ? `<author>noreply@redditcontentplatform.com (${item.author})</author>` : ''}
      ${item.author ? `<dc:creator><![CDATA[${item.author}]]></dc:creator>` : ''}
      ${item.category ? item.category.map(cat => `<category><![CDATA[${cat}]]></category>`).join('\n      ') : ''}
      ${item.keywords ? `<media:keywords><![CDATA[${item.keywords.join(', ')}]]></media:keywords>` : ''}
      ${item.enclosure ? `<enclosure url="${item.enclosure.url}" type="${item.enclosure.type}" length="${item.enclosure.length}" />` : ''}
      <source url="${link}/rss.xml">${title}</source>
    </item>
  `).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:georss="http://www.georss.org/georss"
     xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#">
  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${link}</link>
    <language>${language}</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <generator>${generator}</generator>
    <ttl>${ttl}</ttl>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    ${copyright ? `<copyright><![CDATA[${copyright}]]></copyright>` : ''}
    ${managingEditor ? `<managingEditor>noreply@redditcontentplatform.com (${managingEditor})</managingEditor>` : ''}
    ${webMaster ? `<webMaster>webmaster@redditcontentplatform.com (${webMaster})</webMaster>` : ''}
    ${category ? `<category><![CDATA[${category}]]></category>` : ''}
    <atom:link href="${link}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${link}/logo.png</url>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <width>144</width>
      <height>144</height>
      <description><![CDATA[${description}]]></description>
    </image>
    ${rssItems}
  </channel>
</rss>`;
}

/**
 * Enhanced Atom 1.0 XML feed generation
 */
export function generateEnhancedAtomFeed(options: RSSFeedOptions, items: RSSItem[]): string {
  const {
    title,
    description,
    link,
    copyright,
    managingEditor,
    generator = 'Reddit Content Platform Blog'
  } = options;

  const now = new Date().toISOString();
  const feedId = `${link}/`;

  const atomEntries = items.map(item => `
    <entry>
      <title type="html"><![CDATA[${item.title}]]></title>
      <summary type="html"><![CDATA[${item.description}]]></summary>
      ${item.content ? `<content type="html"><![CDATA[${item.content}]]></content>` : ''}
      <link href="${item.link}" rel="alternate" type="text/html" />
      <id>${item.guid}</id>
      <published>${new Date(item.pubDate).toISOString()}</published>
      <updated>${new Date(item.pubDate).toISOString()}</updated>
      ${item.author ? `<author><name>${item.author}</name><email>noreply@redditcontentplatform.com</email></author>` : ''}
      ${item.category ? item.category.map(cat => `<category term="${cat}" label="${cat}" />`).join('\n      ') : ''}
      ${item.enclosure ? `<link href="${item.enclosure.url}" rel="enclosure" type="${item.enclosure.type}" length="${item.enclosure.length}" />` : ''}
      <source uri="${link}/atom.xml">${title}</source>
    </entry>
  `).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="text">${title}</title>
  <subtitle type="text">${description}</subtitle>
  <link href="${link}" rel="alternate" type="text/html" />
  <link href="${link}/atom.xml" rel="self" type="application/atom+xml" />
  <id>${feedId}</id>
  <updated>${now}</updated>
  <generator uri="${link}" version="1.0">${generator}</generator>
  ${copyright ? `<rights type="text">${copyright}</rights>` : ''}
  ${managingEditor ? `<author><name>${managingEditor}</name><email>team@redditcontentplatform.com</email></author>` : ''}
  <icon>${link}/favicon.ico</icon>
  <logo>${link}/logo.png</logo>
  ${atomEntries}
</feed>`;
}

/**
 * Enhanced JSON Feed generation (JSON Feed 1.1)
 */
export function generateEnhancedJSONFeed(options: RSSFeedOptions, items: RSSItem[]): string {
  const {
    title,
    description,
    link,
    managingEditor,
    generator = 'Reddit Content Platform Blog'
  } = options;

  const jsonItems = items.map(item => ({
    id: item.guid,
    url: item.link,
    title: item.title,
    content_html: item.content || item.description,
    content_text: item.description.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    summary: item.description,
    date_published: new Date(item.pubDate).toISOString(),
    date_modified: new Date(item.pubDate).toISOString(),
    author: item.author ? { 
      name: item.author,
      email: 'noreply@redditcontentplatform.com'
    } : undefined,
    tags: item.category,
    ...(item.enclosure && {
      image: item.enclosure.url,
      banner_image: item.enclosure.url
    }),
    external_url: item.link
  }));

  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title,
    description,
    home_page_url: link,
    feed_url: `${link}/feed.json`,
    language: 'en',
    icon: `${link}/favicon.ico`,
    favicon: `${link}/favicon.ico`,
    author: managingEditor ? { 
      name: managingEditor,
      email: 'team@redditcontentplatform.com'
    } : undefined,
    generator,
    items: jsonItems
  }, null, 2);
}

/**
 * Convert BlogPost to enhanced RSS Item with full content
 */
export function blogPostToEnhancedRSSItem(post: BlogPost, baseUrl: string): RSSItem {
  // Create comprehensive description and content
  const description = post.excerpt || post.content.substring(0, 300) + '...';
  const fullContent = post.content;
  
  return {
    title: post.title,
    description: description,
    content: fullContent,
    link: `${baseUrl}/blog/${post.slug}`,
    guid: `${baseUrl}/blog/${post.slug}`,
    pubDate: new Date(post.publishedAt).toUTCString(),
    author: post.author,
    category: [post.category, ...post.tags],
    keywords: [post.category, ...post.tags, 'reddit', 'trends', 'analysis'],
    ...(post.metadata.socialImage && {
      enclosure: {
        url: post.metadata.socialImage.startsWith('http') 
          ? post.metadata.socialImage 
          : `${baseUrl}${post.metadata.socialImage}`,
        type: post.metadata.socialImage.endsWith('.png') ? 'image/png' : 'image/jpeg',
        length: 0, // Would need to fetch actual file size
      }
    })
  };
}

/**
 * Generate RSS feed for specific category
 */
export function generateCategoryRSSFeed(
  category: string, 
  posts: BlogPost[], 
  baseUrl: string
): string {
  const options: RSSFeedOptions = {
    title: `Reddit Content Platform Blog - ${category}`,
    description: `Latest posts in ${category} category from Reddit Content Platform`,
    link: baseUrl,
    category: category,
    managingEditor: 'Reddit Content Platform Team',
    webMaster: 'Webmaster'
  };

  const items = posts.map(post => blogPostToEnhancedRSSItem(post, baseUrl));
  return generateEnhancedRSSFeed(options, items);
}

/**
 * Generate RSS feed for specific tag
 */
export function generateTagRSSFeed(
  tag: string, 
  posts: BlogPost[], 
  baseUrl: string
): string {
  const options: RSSFeedOptions = {
    title: `Reddit Content Platform Blog - ${tag}`,
    description: `Latest posts tagged with "${tag}" from Reddit Content Platform`,
    link: baseUrl,
    category: tag,
    managingEditor: 'Reddit Content Platform Team',
    webMaster: 'Webmaster'
  };

  const items = posts.map(post => blogPostToEnhancedRSSItem(post, baseUrl));
  return generateEnhancedRSSFeed(options, items);
}