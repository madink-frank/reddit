/**
 * RSS Feed Generation Utilities
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
}

export interface RSSItem {
  title: string;
  description: string;
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
}

/**
 * Generate RSS 2.0 XML feed
 */
export function generateRSSFeed(options: RSSFeedOptions, items: RSSItem[]): string {
  const {
    title,
    description,
    link,
    language = 'en-us',
    copyright,
    managingEditor,
    webMaster,
    category,
    generator = 'Reddit Content Platform Blog'
  } = options;

  const now = new Date().toUTCString();

  const rssItems = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      ${item.author ? `<author>noreply@redditcontentplatform.com (${item.author})</author>` : ''}
      ${item.author ? `<dc:creator><![CDATA[${item.author}]]></dc:creator>` : ''}
      ${item.category ? item.category.map(cat => `<category><![CDATA[${cat}]]></category>`).join('\n      ') : ''}
      ${item.enclosure ? `<enclosure url="${item.enclosure.url}" type="${item.enclosure.type}" length="${item.enclosure.length}" />` : ''}
    </item>
  `).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${link}</link>
    <language>${language}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <generator>${generator}</generator>
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
 * Generate Atom 1.0 XML feed
 */
export function generateAtomFeed(options: RSSFeedOptions, items: RSSItem[]): string {
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
      <link href="${item.link}" />
      <id>${item.guid}</id>
      <published>${new Date(item.pubDate).toISOString()}</published>
      <updated>${new Date(item.pubDate).toISOString()}</updated>
      ${item.author ? `<author><name>${item.author}</name></author>` : ''}
      ${item.category ? item.category.map(cat => `<category term="${cat}" />`).join('\n      ') : ''}
    </entry>
  `).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title><![CDATA[${title}]]></title>
  <subtitle><![CDATA[${description}]]></subtitle>
  <link href="${link}" />
  <link href="${link}/atom.xml" rel="self" type="application/atom+xml" />
  <id>${feedId}</id>
  <updated>${now}</updated>
  <generator uri="${link}">${generator}</generator>
  ${copyright ? `<rights>${copyright}</rights>` : ''}
  ${managingEditor ? `<author><name>${managingEditor}</name></author>` : ''}
  <icon>${link}/favicon.ico</icon>
  <logo>${link}/logo.png</logo>
  ${atomEntries}
</feed>`;
}

/**
 * Convert BlogPost to RSS Item
 */
export function blogPostToRSSItem(post: BlogPost, baseUrl: string): RSSItem {
  // Create a more comprehensive description with HTML content
  const description = post.excerpt || post.content.substring(0, 300) + '...';
  
  return {
    title: post.title,
    description: description,
    link: `${baseUrl}/blog/${post.slug}`,
    guid: `${baseUrl}/blog/${post.slug}`,
    pubDate: new Date(post.publishedAt).toUTCString(),
    author: post.author,
    category: [post.category, ...post.tags],
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
 * Generate JSON Feed (alternative to RSS/Atom)
 */
export function generateJSONFeed(options: RSSFeedOptions, items: RSSItem[]): string {
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
    content_html: item.description,
    summary: item.description,
    date_published: new Date(item.pubDate).toISOString(),
    author: item.author ? { name: item.author } : undefined,
    tags: item.category,
    ...(item.enclosure && {
      image: item.enclosure.url
    })
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
    author: managingEditor ? { name: managingEditor } : undefined,
    generator,
    items: jsonItems
  }, null, 2);
}