/**
 * Enhanced Lighthouse Configuration
 * Comprehensive performance auditing with custom thresholds
 */

module.exports = {
  extends: 'lighthouse:default',
  settings: {
    // Run multiple times and take median for more accurate results
    runs: 5,
    
    // Enhanced throttling settings for realistic conditions
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    
    // Screen emulation for desktop and mobile
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    },
    
    // Form factor
    formFactor: 'desktop',
    
    // Skip certain audits that aren't relevant for our app
    skipAudits: [
      'canonical',
      'robots-txt',
      'hreflang',
      'installable-manifest', // Skip PWA manifest for now
      'apple-touch-icon'
    ],
    
    // Run all relevant categories
    onlyCategories: [
      'performance',
      'accessibility',
      'best-practices',
      'seo',
      'pwa'
    ],
    
    // Custom locale
    locale: 'en-US',
    
    // Output settings
    output: ['json', 'html'],
    
    // Additional settings for better analysis
    maxWaitForFcp: 30000,
    maxWaitForLoad: 45000,
    
    // Emulated user agent
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  
  // Custom audit configuration
  audits: [
    // Core Web Vitals
    'largest-contentful-paint',
    'first-input-delay',
    'cumulative-layout-shift',
    
    // Performance metrics
    'first-contentful-paint',
    'speed-index',
    'total-blocking-time',
    'interactive',
    
    // Resource optimization
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'uses-optimized-images',
    'uses-webp-images',
    'uses-text-compression',
    'uses-responsive-images',
    
    // Accessibility
    'color-contrast',
    'image-alt',
    'label',
    'link-name',
    'button-name',
    'aria-allowed-attr',
    'aria-required-attr',
    'aria-valid-attr-value',
    'aria-valid-attr',
    'heading-order',
    'landmark-one-main',
    'list',
    'listitem',
    'meta-viewport',
    'tabindex',
    
    // Best practices
    'is-on-https',
    'uses-http2',
    'no-vulnerable-libraries',
    'csp-xss',
    'external-anchors-use-rel-noopener'
  ],
  
  // Enhanced categories configuration with custom scoring
  categories: {
    performance: {
      title: 'Performance',
      description: 'Metrics related to loading performance and runtime performance',
      auditRefs: [
        { id: 'first-contentful-paint', weight: 10 },
        { id: 'largest-contentful-paint', weight: 25 },
        { id: 'first-input-delay', weight: 10 },
        { id: 'cumulative-layout-shift', weight: 25 },
        { id: 'speed-index', weight: 10 },
        { id: 'total-blocking-time', weight: 30 },
        { id: 'interactive', weight: 10 },
        { id: 'server-response-time', weight: 5 },
        { id: 'render-blocking-resources', weight: 5 },
        { id: 'unused-css-rules', weight: 3 },
        { id: 'unused-javascript', weight: 3 },
        { id: 'modern-image-formats', weight: 2 },
        { id: 'uses-optimized-images', weight: 2 },
        { id: 'uses-webp-images', weight: 2 },
        { id: 'uses-text-compression', weight: 2 },
        { id: 'uses-responsive-images', weight: 2 }
      ]
    },
    
    accessibility: {
      title: 'Accessibility',
      description: 'These checks highlight opportunities to improve the accessibility of your web app.',
      manualDescription: 'Additional items to manually check',
      auditRefs: [
        { id: 'color-contrast', weight: 7 },
        { id: 'image-alt', weight: 10 },
        { id: 'label', weight: 10 },
        { id: 'link-name', weight: 7 },
        { id: 'button-name', weight: 10 },
        { id: 'aria-allowed-attr', weight: 10 },
        { id: 'aria-required-attr', weight: 10 },
        { id: 'aria-valid-attr-value', weight: 10 },
        { id: 'aria-valid-attr', weight: 10 },
        { id: 'heading-order', weight: 2 },
        { id: 'landmark-one-main', weight: 3 },
        { id: 'list', weight: 3 },
        { id: 'listitem', weight: 3 },
        { id: 'meta-viewport', weight: 10 },
        { id: 'tabindex', weight: 7 }
      ]
    },
    
    'best-practices': {
      title: 'Best Practices',
      description: 'We\'ve compiled some recommendations that may improve the overall code health of your web page.',
      auditRefs: [
        { id: 'is-on-https', weight: 5 },
        { id: 'uses-http2', weight: 5 },
        { id: 'no-vulnerable-libraries', weight: 5 },
        { id: 'csp-xss', weight: 0 },
        { id: 'external-anchors-use-rel-noopener', weight: 5 }
      ]
    },
    
    seo: {
      title: 'SEO',
      description: 'These checks ensure that your page is following basic search engine optimization advice.',
      auditRefs: [
        { id: 'meta-description', weight: 5 },
        { id: 'document-title', weight: 5 },
        { id: 'html-has-lang', weight: 5 },
        { id: 'html-lang-valid', weight: 5 },
        { id: 'viewport', weight: 5 }
      ]
    },
    
    pwa: {
      title: 'Progressive Web App',
      description: 'These checks validate the aspects of a Progressive Web App.',
      auditRefs: [
        { id: 'service-worker', weight: 1 },
        { id: 'works-offline', weight: 1 },
        { id: 'without-javascript', weight: 1 },
        { id: 'is-on-https', weight: 2 },
        { id: 'redirects-http', weight: 2 }
      ]
    }
  },
  
  // Enhanced performance budgets with stricter thresholds
  budgets: [
    {
      path: '/*',
      timings: [
        { metric: 'first-contentful-paint', budget: 1800 },
        { metric: 'largest-contentful-paint', budget: 2500 },
        { metric: 'speed-index', budget: 2800 },
        { metric: 'interactive', budget: 3200 },
        { metric: 'first-meaningful-paint', budget: 2000 },
        { metric: 'first-cpu-idle', budget: 3000 }
      ],
      resourceSizes: [
        { resourceType: 'script', budget: 350 }, // Stricter JS budget
        { resourceType: 'stylesheet', budget: 80 }, // Stricter CSS budget
        { resourceType: 'image', budget: 150 }, // Stricter image budget
        { resourceType: 'font', budget: 80 }, // Stricter font budget
        { resourceType: 'document', budget: 50 },
        { resourceType: 'other', budget: 100 },
        { resourceType: 'total', budget: 800 } // Stricter total budget
      ],
      resourceCounts: [
        { resourceType: 'script', budget: 8 },
        { resourceType: 'stylesheet', budget: 4 },
        { resourceType: 'image', budget: 15 },
        { resourceType: 'font', budget: 4 },
        { resourceType: 'document', budget: 1 },
        { resourceType: 'other', budget: 10 },
        { resourceType: 'total', budget: 40 }
      ]
    }
  ],
  
  // Custom assertions for specific performance requirements
  assertions: {
    'categories:performance': ['error', { minScore: 0.85 }],
    'categories:accessibility': ['error', { minScore: 0.90 }],
    'categories:best-practices': ['error', { minScore: 0.90 }],
    'categories:seo': ['error', { minScore: 0.85 }],
    'audits:first-contentful-paint': ['error', { maxNumericValue: 1800 }],
    'audits:largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
    'audits:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
    'audits:total-blocking-time': ['error', { maxNumericValue: 200 }],
    'audits:unused-css-rules': ['warn', { maxNumericValue: 20000 }],
    'audits:unused-javascript': ['warn', { maxNumericValue: 40000 }]
  }
};