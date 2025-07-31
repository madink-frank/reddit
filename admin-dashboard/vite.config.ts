/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
// import { splitVendorChunkPlugin } from 'vite' // Removed in newer Vite versions
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { buildConfig } from './build.config.js'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'
  const isStaging = mode === 'staging'
  
  // Get build configuration for current mode
  const currentBuildConfig = buildConfig[mode] || buildConfig.development
  
  return {
    plugins: [
      react({
        // Enable React Fast Refresh in development
        fastRefresh: isDevelopment,
        // Optimize JSX in production
        jsxRuntime: 'automatic',
        // Enable React DevTools in development
        include: "**/*.{jsx,tsx}",
        // Optimize React in production
        // babel: isProduction ? {
        //   plugins: [
        //     ['babel-plugin-react-remove-properties', { properties: ['data-testid'] }]
        //   ]
        // } : undefined,
      }),
      // Vendor chunk splitting handled in rollupOptions.output.manualChunks
      // Bundle analyzer - only in build mode
      ...(command === 'build' && env.ANALYZE === 'true' ? [
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // 'treemap', 'sunburst', 'network'
        })
      ] : []),
      // Sentry plugin disabled for now to avoid build issues
      // ...(isProduction && env.VITE_SENTRY_DSN ? [
      //   sentryVitePlugin({
      //     org: env.VITE_SENTRY_ORG,
      //     project: env.VITE_SENTRY_PROJECT,
      //     authToken: env.SENTRY_AUTH_TOKEN,
      //     sourcemaps: {
      //       assets: './dist/**',
      //       ignore: ['node_modules'],
      //     },
      //     release: {
      //       name: env.VITE_APP_VERSION || 'unknown',
      //       uploadLegacySourcemaps: false,
      //     },
      //   })
      // ] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Define global constants
      __DEV__: isDevelopment,
      __PROD__: isProduction,
    },
    build: {
      // Target modern browsers for better optimization
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks - more granular splitting
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
                return 'chart-vendor';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'query-vendor';
              }
              if (id.includes('zustand')) {
                return 'state-vendor';
              }
              if (id.includes('axios') || id.includes('socket.io')) {
                return 'network-vendor';
              }
              if (id.includes('@headlessui') || id.includes('@heroicons') || id.includes('lucide')) {
                return 'ui-vendor';
              }
              // Other vendor libraries
              return 'vendor';
            }
            
            // Feature-based chunks
            if (id.includes('/pages/auth/') || id.includes('/stores/auth') || id.includes('/services/auth')) {
              return 'auth';
            }
            if (id.includes('/pages/DashboardPage') || id.includes('/components/dashboard/')) {
              return 'dashboard';
            }
            if (id.includes('/pages/AnalyticsPage') || id.includes('/components/analytics/') || id.includes('/components/charts/')) {
              return 'analytics';
            }
            if (id.includes('/pages/ContentPage') || id.includes('/components/content/')) {
              return 'content';
            }
            if (id.includes('/pages/KeywordsPage') || id.includes('/components/keywords/')) {
              return 'keywords';
            }
            if (id.includes('/pages/PostsPage') || id.includes('/components/posts/')) {
              return 'posts';
            }
            if (id.includes('/pages/MonitoringPage') || id.includes('/hooks/useCrawling')) {
              return 'monitoring';
            }
          },
          // Optimize asset file names with better caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext || '')) {
              return `assets/css/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js'
        },
        // External dependencies (for CDN usage if needed)
        external: isProduction ? [] : [],
      },
      // Source maps - based on environment config
      sourcemap: currentBuildConfig.sourcemap || env.VITE_SOURCEMAP === 'true',
      // Optimize chunk size warnings
      chunkSizeWarningLimit: currentBuildConfig.chunkSizeWarningLimit,
      // Asset optimization
      assetsInlineLimit: buildConfig.optimization.assets.inlineLimit,
      // CSS optimization
      cssCodeSplit: true,
      cssMinify: isProduction ? 'esbuild' : false,
      // Minification settings - use esbuild instead of terser
      minify: 'esbuild',
      // Report compressed file sizes
      reportCompressedSize: true,
      // Emit manifest for advanced deployment scenarios
      manifest: isProduction,
    },
    // Development server optimization
    server: {
      // Enable HMR
      hmr: true,
      // Optimize deps pre-bundling
      optimizeDeps: {
        include: buildConfig.optimization.optimizeDeps,
      },
    },
    // Preview server settings
    preview: {
      port: 4173,
      strictPort: true,
    },
    // Environment variables
    envPrefix: 'VITE_',
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Test optimization
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
    },
  }
})