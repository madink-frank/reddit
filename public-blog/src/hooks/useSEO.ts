import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'blog' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  canonical?: string;
  noIndex?: boolean;
}

interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

/**
 * Hook for managing SEO metadata and structured data
 */
export function useSEO(seoData: SEOData) {
  const location = useLocation();

  useEffect(() => {
    // Update document title
    if (seoData.title) {
      const siteTitle = 'Reddit Content Platform Blog';
      document.title = `${seoData.title} | ${siteTitle}`;
    }

    // Update meta description
    if (seoData.description) {
      updateMetaTag('description', seoData.description);
    }

    // Update keywords
    if (seoData.keywords && seoData.keywords.length > 0) {
      updateMetaTag('keywords', seoData.keywords.join(', '));
    }

    // Update canonical URL
    if (seoData.canonical) {
      updateLinkTag('canonical', seoData.canonical);
    }

    // Update robots meta tag
    if (seoData.noIndex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }

    // Update Open Graph tags
    updateOpenGraphTags(seoData);

    // Update Twitter Card tags
    updateTwitterCardTags(seoData);

    // Update structured data
    updateStructuredData(seoData);

  }, [seoData, location.pathname]);
}

/**
 * Update or create a meta tag
 */
function updateMetaTag(name: string, content: string, property = false) {
  const attribute = property ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
}

/**
 * Update or create a link tag
 */
function updateLinkTag(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  
  link.setAttribute('href', href);
}

/**
 * Update Open Graph meta tags
 */
function updateOpenGraphTags(seoData: SEOData) {
  const siteUrl = window.location.origin;
  const currentUrl = `${siteUrl}${window.location.pathname}`;
  
  updateMetaTag('og:type', seoData.type || 'website', true);
  
  if (seoData.title) {
    updateMetaTag('og:title', seoData.title, true);
  }
  
  if (seoData.description) {
    updateMetaTag('og:description', seoData.description, true);
  }
  
  updateMetaTag('og:url', currentUrl, true);
  
  if (seoData.image) {
    const imageUrl = seoData.image.startsWith('http') ? seoData.image : `${siteUrl}${seoData.image}`;
    updateMetaTag('og:image', imageUrl, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
  }
  
  updateMetaTag('og:site_name', 'Reddit Content Platform Blog', true);
  updateMetaTag('og:locale', 'en_US', true);
  
  if (seoData.type === 'article') {
    if (seoData.publishedTime) {
      updateMetaTag('article:published_time', seoData.publishedTime, true);
    }
    if (seoData.modifiedTime) {
      updateMetaTag('article:modified_time', seoData.modifiedTime, true);
    }
    if (seoData.author) {
      updateMetaTag('article:author', seoData.author, true);
    }
    if (seoData.section) {
      updateMetaTag('article:section', seoData.section, true);
    }
    if (seoData.tags) {
      seoData.tags.forEach(tag => {
        updateMetaTag('article:tag', tag, true);
      });
    }
  }
}

/**
 * Update Twitter Card meta tags
 */
function updateTwitterCardTags(seoData: SEOData) {
  updateMetaTag('twitter:card', 'summary_large_image');
  
  if (seoData.title) {
    updateMetaTag('twitter:title', seoData.title);
  }
  
  if (seoData.description) {
    updateMetaTag('twitter:description', seoData.description);
  }
  
  if (seoData.image) {
    const siteUrl = window.location.origin;
    const imageUrl = seoData.image.startsWith('http') ? seoData.image : `${siteUrl}${seoData.image}`;
    updateMetaTag('twitter:image', imageUrl);
  }
  
  updateMetaTag('twitter:site', '@redditcontent');
  
  if (seoData.author) {
    updateMetaTag('twitter:creator', `@${seoData.author.replace(/\s+/g, '').toLowerCase()}`);
  }
}

/**
 * Update structured data (JSON-LD)
 */
function updateStructuredData(seoData: SEOData) {
  const siteUrl = window.location.origin;
  const currentUrl = `${siteUrl}${window.location.pathname}`;
  
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"][data-seo-hook]');
  if (existingScript) {
    existingScript.remove();
  }
  
  let structuredData: StructuredData;
  
  if (seoData.type === 'article') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: seoData.title || '',
      description: seoData.description || '',
      url: currentUrl,
      datePublished: seoData.publishedTime || new Date().toISOString(),
      dateModified: seoData.modifiedTime || seoData.publishedTime || new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: seoData.author || 'Reddit Content Platform Team',
        url: `${siteUrl}/about`
      },
      publisher: {
        '@type': 'Organization',
        name: 'Reddit Content Platform Blog',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/logo.png`,
          width: 144,
          height: 144
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': currentUrl
      },
      inLanguage: 'en-US',
      isAccessibleForFree: true
    };
    
    if (seoData.image) {
      structuredData.image = {
        '@type': 'ImageObject',
        url: seoData.image.startsWith('http') ? seoData.image : `${siteUrl}${seoData.image}`,
        width: 1200,
        height: 630
      };
    }
    
    if (seoData.keywords && seoData.keywords.length > 0) {
      structuredData.keywords = seoData.keywords;
    }
    
    if (seoData.section) {
      structuredData.articleSection = seoData.section;
    }
    
    if (seoData.tags && seoData.tags.length > 0) {
      structuredData.about = seoData.tags.map(tag => ({
        '@type': 'Thing',
        name: tag
      }));
    }
  } else {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Reddit Content Platform Blog',
      description: seoData.description || 'Discover trending topics and insights from Reddit communities through AI-powered content analysis.',
      url: siteUrl,
      publisher: {
        '@type': 'Organization',
        name: 'Reddit Content Platform Blog',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/logo.png`
        }
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      },
      inLanguage: 'en-US'
    };
  }
  
  // Add structured data script
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-seo-hook', 'true');
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}

/**
 * Hook for managing page-specific breadcrumbs
 */
export function useBreadcrumbs(breadcrumbs: Array<{ name: string; url: string }>) {
  useEffect(() => {
    if (breadcrumbs.length === 0) return;
    
    // Remove existing breadcrumb structured data
    const existingScript = document.querySelector('script[type="application/ld+json"][data-breadcrumbs]');
    if (existingScript) {
      existingScript.remove();
    }
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url.startsWith('http') ? crumb.url : `${window.location.origin}${crumb.url}`
      }))
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-breadcrumbs', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-breadcrumbs]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [breadcrumbs]);
}

/**
 * Hook for managing FAQ structured data
 */
export function useFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  useEffect(() => {
    if (faqs.length === 0) return;
    
    // Remove existing FAQ structured data
    const existingScript = document.querySelector('script[type="application/ld+json"][data-faq]');
    if (existingScript) {
      existingScript.remove();
    }
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-faq', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-faq]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [faqs]);
}

export default useSEO;