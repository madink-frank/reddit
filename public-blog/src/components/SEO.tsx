import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'blog' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  canonical?: string;
  locale?: string;
  alternateLocales?: Array<{ locale: string; url: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  faqData?: Array<{ question: string; answer: string }>;
  reviewData?: {
    rating: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  organizationData?: {
    name: string;
    url: string;
    logo: string;
    sameAs?: string[];
    contactPoint?: {
      telephone?: string;
      email?: string;
      contactType?: string;
    };
  };
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  noIndex = false,
  canonical,
  locale = 'en_US',
  alternateLocales = [],
  breadcrumbs = [],
  faqData = [],
  reviewData,
  organizationData,
}) => {
  const siteTitle = 'Reddit Content Platform Blog';
  const siteDescription = 'Discover trending topics and insights from Reddit communities through AI-powered content analysis.';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const fullDescription = description || siteDescription;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}/og-default.jpg`;

  const allKeywords = [...keywords, ...tags, 'reddit', 'trends', 'social media', 'content analysis'];
  const keywordsString = allKeywords.join(', ');

  // Default organization data
  const defaultOrganization = {
    name: siteTitle,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://github.com/reddit-content-platform',
      'https://twitter.com/redditcontent'
    ],
    contactPoint: {
      email: 'team@redditcontentplatform.com',
      contactType: 'customer service'
    }
  };

  const organization = { ...defaultOrganization, ...organizationData };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {keywordsString && <meta name="keywords" content={keywordsString} />}
      {author && <meta name="author" content={author} />}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Language and Locale */}
      <html lang={locale.split('_')[0]} />
      <meta httpEquiv="content-language" content={locale.split('_')[0]} />
      
      {/* Alternate Language Versions */}
      {alternateLocales.map(({ locale: altLocale, url: altUrl }) => (
        <link key={altLocale} rel="alternate" hrefLang={altLocale.split('_')[0]} href={altUrl} />
      ))}
      
      {/* RSS and Atom Feeds */}
      <link rel="alternate" type="application/rss+xml" title={`${siteTitle} RSS Feed`} href={`${siteUrl}/rss.xml`} />
      <link rel="alternate" type="application/atom+xml" title={`${siteTitle} Atom Feed`} href={`${siteUrl}/atom.xml`} />
      <link rel="alternate" type="application/json" title={`${siteTitle} JSON Feed`} href={`${siteUrl}/feed.json`} />
      
      {/* Sitemap */}
      <link rel="sitemap" type="application/xml" title="Sitemap" href={`${siteUrl}/sitemap.xml`} />
      
      {/* Robots and SEO Directives */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        </>
      )}
      
      {/* Additional SEO Meta Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteTitle} />
      
      {/* Geo Tags (if applicable) */}
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Copyright and Rights */}
      <meta name="copyright" content={`© ${new Date().getFullYear()} ${organization.name}`} />
      <meta name="rights" content={organization.name} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:alt" content={title || siteTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content={locale} />
      
      {/* Additional Open Graph for different content types */}
      {type === 'article' && (
        <>
          <meta property="og:article:author" content={author || organization.name} />
          <meta property="og:article:publisher" content={organization.url} />
        </>
      )}
      
      {/* Open Graph Alternate Locales */}
      {alternateLocales.map(({ locale: altLocale }) => (
        <meta key={altLocale} property="og:locale:alternate" content={altLocale} />
      ))}
      
      {/* Article specific Open Graph */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={title || siteTitle} />
      <meta name="twitter:site" content="@redditcontent" />
      <meta name="twitter:creator" content={author ? `@${author.replace(/\s+/g, '').toLowerCase()}` : "@redditcontent"} />
      
      {/* Additional Twitter Meta */}
      <meta name="twitter:domain" content={new URL(siteUrl).hostname} />
      <meta name="twitter:url" content={fullUrl} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      
      {/* Main Structured Data - JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'article' ? 'BlogPosting' : type === 'blog' ? 'Blog' : 'WebSite',
          ...(type === 'article' ? {
            headline: title,
            description: fullDescription,
            image: {
              '@type': 'ImageObject',
              url: fullImage,
              width: 1200,
              height: 630,
              caption: title || siteTitle
            },
            author: {
              '@type': 'Person',
              name: author || 'Reddit Content Platform Team',
              url: `${siteUrl}/about`,
              sameAs: [`${siteUrl}/about`]
            },
            publisher: {
              '@type': 'Organization',
              name: organization.name,
              url: organization.url,
              logo: {
                '@type': 'ImageObject',
                url: organization.logo,
                width: 144,
                height: 144
              },
              sameAs: organization.sameAs,
              ...(organization.contactPoint && {
                contactPoint: {
                  '@type': 'ContactPoint',
                  ...organization.contactPoint
                }
              })
            },
            datePublished: publishedTime,
            dateModified: modifiedTime || publishedTime,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': fullUrl,
            },
            keywords: allKeywords,
            articleSection: section,
            wordCount: description ? description.split(' ').length : undefined,
            inLanguage: locale.split('_')[0],
            isAccessibleForFree: true,
            copyrightYear: new Date().getFullYear(),
            copyrightHolder: {
              '@type': 'Organization',
              name: organization.name
            },
            ...(tags.length > 0 && {
              about: tags.map(tag => ({
                '@type': 'Thing',
                name: tag,
                sameAs: `${siteUrl}/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`
              }))
            }),
            ...(reviewData && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: reviewData.rating,
                reviewCount: reviewData.reviewCount,
                bestRating: reviewData.bestRating || 5,
                worstRating: reviewData.worstRating || 1
              }
            })
          } : type === 'blog' ? {
            name: siteTitle,
            description: siteDescription,
            url: `${siteUrl}/blog`,
            inLanguage: locale.split('_')[0],
            publisher: {
              '@type': 'Organization',
              name: organization.name,
              url: organization.url,
              logo: {
                '@type': 'ImageObject',
                url: organization.logo
              }
            },
            blogPost: [], // This would be populated with recent posts
            author: {
              '@type': 'Organization',
              name: organization.name
            }
          } : {
            name: siteTitle,
            description: siteDescription,
            url: siteUrl,
            inLanguage: locale.split('_')[0],
            publisher: {
              '@type': 'Organization',
              name: organization.name,
              url: organization.url,
              logo: {
                '@type': 'ImageObject',
                url: organization.logo,
                width: 144,
                height: 144
              },
              sameAs: organization.sameAs
            },
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteUrl}/search?q={search_term_string}`
              },
              'query-input': 'required name=search_term_string',
            },
            mainEntity: {
              '@type': 'Blog',
              name: siteTitle,
              description: siteDescription,
              url: `${siteUrl}/blog`,
              publisher: {
                '@type': 'Organization',
                name: organization.name
              }
            },
            copyrightYear: new Date().getFullYear(),
            copyrightHolder: {
              '@type': 'Organization',
              name: organization.name
            }
          }),
        })}
      </script>
      
      {/* Breadcrumb structured data */}
      {breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((crumb, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: crumb.name,
              item: crumb.url.startsWith('http') ? crumb.url : `${siteUrl}${crumb.url}`
            }))
          })}
        </script>
      )}
      
      {/* FAQ structured data */}
      {faqData.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqData.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer
              }
            }))
          })}
        </script>
      )}
      
      {/* Organization structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: organization.name,
          url: organization.url,
          logo: {
            '@type': 'ImageObject',
            url: organization.logo,
            width: 144,
            height: 144
          },
          description: siteDescription,
          foundingDate: '2024',
          sameAs: organization.sameAs,
          ...(organization.contactPoint && {
            contactPoint: {
              '@type': 'ContactPoint',
              ...organization.contactPoint
            }
          }),
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'US'
          },
          areaServed: {
            '@type': 'Country',
            name: 'United States'
          },
          knowsAbout: [
            'Reddit Analysis',
            'Social Media Trends',
            'Content Creation',
            'Data Analytics',
            'Community Insights'
          ]
        })}
      </script>
      
      {/* WebSite structured data with search functionality */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: siteTitle,
          url: siteUrl,
          potentialAction: [
            {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteUrl}/search?q={search_term_string}`
              },
              'query-input': 'required name=search_term_string'
            },
            {
              '@type': 'ReadAction',
              target: `${siteUrl}/blog`
            }
          ],
          publisher: {
            '@type': 'Organization',
            name: organization.name
          },
          copyrightYear: new Date().getFullYear(),
          inLanguage: locale.split('_')[0]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;