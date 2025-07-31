/**
 * Build Configuration
 * Environment-specific build settings and optimizations
 */

export const buildConfig = {
  // Development configuration
  development: {
    sourcemap: true,
    minify: false,
    dropConsole: false,
    enableDevtools: true,
    chunkSizeWarningLimit: 2000,
    target: 'es2020',
  },

  // Staging configuration
  staging: {
    sourcemap: true,
    minify: 'terser',
    dropConsole: false,
    enableDevtools: true,
    chunkSizeWarningLimit: 1500,
    target: 'es2020',
  },

  // Production configuration
  production: {
    sourcemap: false,
    minify: 'terser',
    dropConsole: true,
    enableDevtools: false,
    chunkSizeWarningLimit: 1000,
    target: 'es2020',
  },

  // Bundle size thresholds (in KB)
  sizeThresholds: {
    mainChunk: 500,
    vendorChunk: 800,
    asyncChunk: 300,
    cssFile: 100,
    assetFile: 200,
    totalSize: 2000,
  },

  // Optimization settings
  optimization: {
    // Dependencies to pre-bundle for faster dev server startup
    optimizeDeps: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'axios',
      'chart.js',
      'react-chartjs-2',
      '@headlessui/react',
      '@heroicons/react',
      'lucide-react',
      'date-fns',
      'clsx',
      'tailwind-merge',
    ],

    // Manual chunk configuration for better caching
    manualChunks: {
      // React ecosystem
      'react-vendor': ['react', 'react-dom', 'react-router-dom'],
      
      // State management and data fetching
      'state-vendor': ['zustand', '@tanstack/react-query'],
      
      // UI libraries
      'ui-vendor': [
        '@headlessui/react',
        '@heroicons/react',
        'lucide-react',
        'clsx',
        'tailwind-merge',
      ],
      
      // Charts and visualization
      'chart-vendor': ['chart.js', 'react-chartjs-2'],
      
      // Network and utilities
      'utils-vendor': ['axios', 'date-fns', 'socket.io-client'],
    },

    // Assets optimization
    assets: {
      // Inline assets smaller than 4KB
      inlineLimit: 4096,
      
      // Asset file naming patterns
      patterns: {
        images: 'assets/images/[name]-[hash][extname]',
        fonts: 'assets/fonts/[name]-[hash][extname]',
        css: 'assets/css/[name]-[hash][extname]',
        js: 'assets/js/[name]-[hash].js',
      },
    },

    // Terser configuration for production
    terser: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
      },
      mangle: {
        safari10: true,
        properties: {
          regex: /^_/,
        },
      },
      format: {
        comments: false,
        ascii_only: true,
      },
      ecma: 2020,
    },
  },

  // Environment-specific feature flags
  features: {
    development: {
      enableAnalytics: true,
      enableNotifications: true,
      enableDevTools: true,
      enablePerformanceMonitoring: false,
      keepConsole: true,
    },
    staging: {
      enableAnalytics: true,
      enableNotifications: true,
      enableDevTools: true,
      enablePerformanceMonitoring: true,
      keepConsole: true,
    },
    production: {
      enableAnalytics: true,
      enableNotifications: true,
      enableDevTools: false,
      enablePerformanceMonitoring: true,
      keepConsole: false,
    },
  },
};

export default buildConfig;