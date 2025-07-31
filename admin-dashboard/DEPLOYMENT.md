# Admin Dashboard Deployment Guide

This guide covers deploying the Reddit Content Platform Admin Dashboard to various hosting platforms.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git repository access
- Environment variables configured

## Supported Platforms

### 1. Vercel (Recommended for Static Hosting)

#### Quick Deploy
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
npm run deploy:vercel:prod

# Deploy to staging
npm run deploy:vercel:staging
```

#### Manual Setup
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build:prod`
3. Set output directory: `dist`
4. Configure environment variables (see below)

#### Environment Variables (Vercel)
```bash
VITE_NODE_ENV=production
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
VITE_WS_URL=wss://your-api-domain.com/ws
VITE_REDDIT_CLIENT_ID=your_reddit_client_id
VITE_REDDIT_REDIRECT_URI=https://your-admin-domain.vercel.app/auth/callback
VITE_ADMIN_USERNAMES=your_admin_username
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_DEV_TOOLS=false
VITE_KEEP_CONSOLE=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=production
```

### 2. Railway (Full-Stack Hosting)

#### Quick Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy to production
npm run deploy:railway:prod

# Deploy to staging
npm run deploy:railway:staging
```

#### Manual Setup
1. Connect your GitHub repository to Railway
2. Set build command: `npm run build:prod`
3. Set start command: `npx serve -s dist -l $PORT`
4. Configure environment variables (see below)

#### Environment Variables (Railway)
```bash
NODE_ENV=production
VITE_NODE_ENV=production
VITE_API_BASE_URL=https://your-api-domain.railway.app/api/v1
VITE_WS_URL=wss://your-api-domain.railway.app/ws
VITE_REDDIT_CLIENT_ID=your_reddit_client_id
VITE_REDDIT_REDIRECT_URI=https://your-admin-domain.railway.app/auth/callback
VITE_ADMIN_USERNAMES=your_admin_username
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_DEV_TOOLS=false
VITE_KEEP_CONSOLE=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=production
```

### 3. Netlify

#### Quick Deploy
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build:prod
netlify deploy --prod --dir=dist
```

#### Manual Setup
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build:prod`
3. Set publish directory: `dist`
4. Configure environment variables
5. Add `_redirects` file for SPA routing

## Build Commands

### Development
```bash
npm run build:dev          # Development build
npm run build:staging      # Staging build
npm run build:prod         # Production build
npm run build:analyze      # Production build with bundle analysis
```

### Quality Checks
```bash
npm run type-check         # TypeScript type checking
npm run lint              # ESLint checking
npm run test:run          # Run all tests
npm run test:e2e          # End-to-end tests
npm run size-check        # Bundle size analysis
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://api.example.com/api/v1` |
| `VITE_WS_URL` | WebSocket URL | `wss://api.example.com/ws` |
| `VITE_REDDIT_CLIENT_ID` | Reddit OAuth Client ID | `your_client_id` |
| `VITE_REDDIT_REDIRECT_URI` | OAuth Redirect URI | `https://admin.example.com/auth/callback` |
| `VITE_ADMIN_USERNAMES` | Admin usernames (comma-separated) | `admin1,admin2` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ENABLE_ANALYTICS` | Enable analytics features | `true` |
| `VITE_ENABLE_NOTIFICATIONS` | Enable notifications | `true` |
| `VITE_ENABLE_DEV_TOOLS` | Enable dev tools | `false` |
| `VITE_KEEP_CONSOLE` | Keep console logs | `false` |
| `VITE_ENABLE_PERFORMANCE_MONITORING` | Enable performance monitoring | `true` |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | - |
| `VITE_SENTRY_ENVIRONMENT` | Sentry environment | `production` |

## Domain and SSL Configuration

### Custom Domain Setup

#### Vercel
1. Go to your project settings in Vercel dashboard
2. Navigate to "Domains" section
3. Add your custom domain
4. Configure DNS records as instructed
5. SSL certificate is automatically provisioned

#### Railway
1. Go to your project settings in Railway dashboard
2. Navigate to "Settings" > "Domains"
3. Add your custom domain
4. Configure DNS records as instructed
5. SSL certificate is automatically provisioned

### DNS Configuration

For both platforms, you'll typically need to add:
- A record pointing to the platform's IP
- CNAME record for www subdomain
- TXT record for domain verification

## Security Headers

The deployment includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Performance Optimization

### Build Optimizations
- Code splitting by routes and features
- Vendor chunk separation
- Asset optimization and compression
- Tree shaking for unused code elimination
- Minification with Terser

### Caching Strategy
- Static assets: 1 year cache with immutable flag
- HTML files: No cache with must-revalidate
- Service Worker: No cache for updates

### Bundle Analysis
```bash
npm run build:analyze      # Generate bundle analysis
npm run size-check        # Check bundle sizes against thresholds
```

## Monitoring and Debugging

### Error Tracking
- Sentry integration for error monitoring
- Source maps for debugging (staging only)
- Performance monitoring with Web Vitals

### Health Checks
- Deployment health checks configured
- Automatic restart on failure
- Timeout configuration for startup

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+ required)
   - Verify all dependencies are installed
   - Check TypeScript compilation errors

2. **Environment Variables Not Working**
   - Ensure variables start with `VITE_`
   - Check platform-specific variable configuration
   - Verify variable values are properly escaped

3. **Routing Issues (404 on Refresh)**
   - Ensure SPA routing is configured
   - Check `_redirects` file for Netlify
   - Verify `vercel.json` rewrites for Vercel

4. **API Connection Issues**
   - Verify API URL is correct and accessible
   - Check CORS configuration on backend
   - Ensure WebSocket URL is properly configured

### Debug Commands
```bash
npm run build:dev         # Build with source maps
npm run preview           # Preview production build locally
npm run test:e2e:headed   # Run E2E tests with browser UI
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate provisioned
- [ ] Build passes all quality checks
- [ ] Bundle sizes within acceptable limits
- [ ] E2E tests passing
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Admin access verified
- [ ] API connectivity confirmed
- [ ] WebSocket connection working
- [ ] Authentication flow tested

## Support

For deployment issues:
1. Check the platform-specific documentation
2. Review build logs for errors
3. Verify environment variable configuration
4. Test locally with production build
5. Check network connectivity to backend services