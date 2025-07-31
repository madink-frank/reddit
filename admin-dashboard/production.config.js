/**
 * Production Configuration
 * 
 * Comprehensive configuration for production deployment of the advanced dashboard
 */

const path = require('path');

// Environment validation
const requiredEnvVars = [
  'VITE_API_BASE_URL',
  'VITE_NODE_ENV'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Production configuration
const productionConfig = {
  // Application settings
  app: {
    name: 'Reddit Content Platform - Advanced Dashboard',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.VITE_NODE_ENV || 'production',
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },

  // API configuration
  api: {
    baseUrl: process.env.VITE_API_BASE_URL,
    timeout: parseInt(process.env.API_TIMEOUT) || 30000,
    retries: parseInt(process.env.API_RETRIES) || 3,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 1000 // requests per window
    }
  },

  // Security settings
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://yourdomain.com'],
      credentials: true,
      optionsSuccessStatus: 200
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", process.env.VITE_API_BASE_URL],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    },
    session: {
      secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.VITE_NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      }
    }
  },

  // Performance settings
  performance: {
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024
    },
    caching: {
      staticAssets: {
        maxAge: 31536000, // 1 year
        immutable: true
      },
      api: {
        maxAge: 300, // 5 minutes
        staleWhileRevalidate: 60
      }
    },
    bundleAnalysis: {
      enabled: process.env.ANALYZE_BUNDLE === 'true',
      outputDir: 'bundle-analysis'
    }
  },

  // Monitoring and logging
  monitoring: {
    healthCheck: {
      enabled: true,
      endpoint: '/health',
      interval: 30000,
      timeout: 5000
    },
    metrics: {
      enabled: true,
      endpoint: '/metrics',
      collectDefaultMetrics: true,
      customMetrics: [
        'nlp_analysis_requests_total',
        'image_analysis_requests_total',
        'export_requests_total',
        'user_sessions_active'
      ]
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: 'json',
      transports: [
        {
          type: 'file',
          filename: 'logs/application.log',
          maxSize: '100MB',
          maxFiles: 10,
          tailable: true
        },
        {
          type: 'file',
          level: 'error',
          filename: 'logs/error.log',
          maxSize: '50MB',
          maxFiles: 5
        }
      ]
    },
    apm: {
      serviceName: 'reddit-content-platform-dashboard',
      environment: process.env.VITE_NODE_ENV,
      serverUrl: process.env.ELASTIC_APM_SERVER_URL,
      secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
      active: !!process.env.ELASTIC_APM_SERVER_URL
    }
  },

  // Database configuration (if applicable)
  database: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    }
  },

  // Feature flags
  features: {
    nlpAnalysis: {
      enabled: process.env.FEATURE_NLP_ANALYSIS !== 'false',
      batchSize: parseInt(process.env.NLP_BATCH_SIZE) || 100,
      timeout: parseInt(process.env.NLP_TIMEOUT) || 30000
    },
    imageAnalysis: {
      enabled: process.env.FEATURE_IMAGE_ANALYSIS !== 'false',
      maxFileSize: parseInt(process.env.IMAGE_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
      supportedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp']
    },
    advancedAnalytics: {
      enabled: process.env.FEATURE_ADVANCED_ANALYTICS !== 'false',
      dataRetentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS) || 90
    },
    realTimeMonitoring: {
      enabled: process.env.FEATURE_REAL_TIME_MONITORING !== 'false',
      websocketTimeout: parseInt(process.env.WEBSOCKET_TIMEOUT) || 30000
    },
    billingSystem: {
      enabled: process.env.FEATURE_BILLING_SYSTEM !== 'false',
      pointsPerAnalysis: parseInt(process.env.POINTS_PER_ANALYSIS) || 1,
      pointsPerExport: parseInt(process.env.POINTS_PER_EXPORT) || 5
    },
    exportReporting: {
      enabled: process.env.FEATURE_EXPORT_REPORTING !== 'false',
      maxExportSize: parseInt(process.env.MAX_EXPORT_SIZE) || 100000,
      supportedFormats: ['json', 'csv', 'xlsx', 'pdf']
    }
  },

  // Build configuration
  build: {
    sourceMaps: process.env.GENERATE_SOURCEMAP === 'true',
    minify: true,
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts', 'd3'],
          ui: ['lucide-react', '@radix-ui/react-dialog'],
          utils: ['date-fns', 'lodash']
        }
      }
    }
  },

  // Deployment configuration
  deployment: {
    platform: process.env.DEPLOY_PLATFORM || 'vercel',
    region: process.env.DEPLOY_REGION || 'us-east-1',
    domains: process.env.CUSTOM_DOMAINS ? process.env.CUSTOM_DOMAINS.split(',') : [],
    ssl: {
      enabled: true,
      redirect: true
    },
    cdn: {
      enabled: true,
      provider: process.env.CDN_PROVIDER || 'cloudflare',
      cacheControl: 'public, max-age=31536000, immutable'
    }
  },

  // Error handling
  errorHandling: {
    sentry: {
      enabled: !!process.env.SENTRY_DSN,
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VITE_NODE_ENV,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
      beforeSend: (event) => {
        // Filter out sensitive information
        if (event.request && event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      }
    },
    fallback: {
      enabled: true,
      component: 'ErrorBoundary',
      redirectUrl: '/error'
    }
  },

  // Analytics and tracking
  analytics: {
    googleAnalytics: {
      enabled: !!process.env.GA_MEASUREMENT_ID,
      measurementId: process.env.GA_MEASUREMENT_ID,
      anonymizeIp: true,
      respectDoNotTrack: true
    },
    mixpanel: {
      enabled: !!process.env.MIXPANEL_TOKEN,
      token: process.env.MIXPANEL_TOKEN,
      trackPageViews: true,
      respectDoNotTrack: true
    }
  },

  // Progressive Web App
  pwa: {
    enabled: true,
    name: 'Reddit Content Platform Dashboard',
    shortName: 'RCP Dashboard',
    description: 'Advanced analytics dashboard for Reddit content analysis',
    themeColor: '#1f2937',
    backgroundColor: '#111827',
    display: 'standalone',
    orientation: 'portrait-primary',
    scope: '/',
    startUrl: '/',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
};

// Validation function
const validateConfig = (config) => {
  const errors = [];

  // Validate API URL
  try {
    new URL(config.api.baseUrl);
  } catch (e) {
    errors.push('Invalid API base URL');
  }

  // Validate ports
  if (config.app.port < 1 || config.app.port > 65535) {
    errors.push('Invalid port number');
  }

  // Validate session secret in production
  if (config.app.environment === 'production' && 
      config.security.session.secret === 'your-super-secret-key-change-in-production') {
    errors.push('Session secret must be changed in production');
  }

  // Validate required features
  const requiredFeatures = ['nlpAnalysis', 'imageAnalysis'];
  requiredFeatures.forEach(feature => {
    if (!config.features[feature].enabled) {
      console.warn(`Warning: Required feature '${feature}' is disabled`);
    }
  });

  if (errors.length > 0) {
    console.error('Configuration validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  return true;
};

// Environment-specific overrides
const environmentOverrides = {
  development: {
    security: {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173']
      }
    },
    monitoring: {
      logging: {
        level: 'debug',
        transports: [
          {
            type: 'console',
            colorize: true
          }
        ]
      }
    }
  },
  
  staging: {
    monitoring: {
      logging: {
        level: 'debug'
      }
    },
    build: {
      sourceMaps: true
    }
  },
  
  production: {
    security: {
      session: {
        cookie: {
          secure: true,
          sameSite: 'strict'
        }
      }
    }
  }
};

// Apply environment-specific overrides
const applyOverrides = (config, environment) => {
  const overrides = environmentOverrides[environment];
  if (!overrides) return config;

  const merge = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  };

  return merge({ ...config }, overrides);
};

// Final configuration
const finalConfig = applyOverrides(productionConfig, productionConfig.app.environment);

// Validate configuration
validateConfig(finalConfig);

// Export configuration
module.exports = finalConfig;

// Also export individual sections for easier access
module.exports.app = finalConfig.app;
module.exports.api = finalConfig.api;
module.exports.security = finalConfig.security;
module.exports.performance = finalConfig.performance;
module.exports.monitoring = finalConfig.monitoring;
module.exports.features = finalConfig.features;
module.exports.build = finalConfig.build;
module.exports.deployment = finalConfig.deployment;