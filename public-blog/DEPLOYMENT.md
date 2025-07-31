# Public Blog Deployment Guide

This guide covers deploying the Reddit Trends Public Blog to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm install -g vercel`
3. **GitHub Repository**: Connected to Vercel for automatic deployments

## Environment Variables

### Required Environment Variables

Set these in your Vercel project dashboard:

```bash
# API Configuration
VITE_API_BASE_URL=https://your-backend-api.railway.app/api/v1
VITE_API_TIMEOUT=15000

# Blog Configuration
VITE_BLOG_TITLE=Reddit Trends Blog
VITE_BLOG_DESCRIPTION=Discover trending topics and insights from Reddit communities
VITE_BLOG_AUTHOR=Reddit Content Platform
VITE_BLOG_URL=https://your-blog-domain.vercel.app

# SEO Configuration
VITE_SITE_NAME=Reddit Trends Blog
VITE_SITE_DESCRIPTION=Stay updated with the latest trends and insights from Reddit communities
VITE_SITE_KEYWORDS=reddit,trends,blog,social media,content,analysis

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX

# Features
VITE_ENABLE_COMMENTS=true
VITE_ENABLE_SEARCH=true
VITE_ENABLE_RSS=true
VITE_ENABLE_NEWSLETTER=true

# Production Settings
VITE_DEBUG_MODE=false
VITE_MOCK_API=false
NODE_ENV=production
```

## Manual Deployment

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

For preview deployment:
```bash
npm run deploy:preview
```

For production deployment:
```bash
npm run deploy:vercel
```

Or use the deployment script:
```bash
./scripts/deploy-vercel.sh
```

## Automatic Deployment

### GitHub Actions Setup

1. **Add Vercel Secrets to GitHub**:
   - Go to your GitHub repository settings
   - Navigate to Secrets and Variables > Actions
   - Add the following secrets:
     - `VERCEL_TOKEN`: Your Vercel API token
     - `VERCEL_ORG_ID`: Your Vercel organization ID
     - `VERCEL_PROJECT_ID`: Your Vercel project ID

2. **Get Vercel Project Information**:
   ```bash
   # In your project directory
   vercel link
   # This creates .vercel/project.json with your project details
   ```

3. **Automatic Deployment Triggers**:
   - **Production**: Pushes to `main` branch
   - **Preview**: Pull requests to `main` branch
   - **Path Filter**: Only triggers on changes to `public-blog/` directory

## Domain Configuration

### Custom Domain Setup

1. **Add Domain in Vercel Dashboard**:
   - Go to your project settings
   - Navigate to Domains
   - Add your custom domain

2. **DNS Configuration**:
   ```
   Type: CNAME
   Name: blog (or www)
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate**:
   - Vercel automatically provisions SSL certificates
   - HTTPS is enabled by default

## Performance Optimizations

### Build Optimizations

- **Code Splitting**: Automatic chunk splitting for optimal loading
- **Asset Optimization**: Images and fonts are optimized
- **Compression**: Gzip compression enabled
- **Caching**: Static assets cached for 1 year

### Vercel-Specific Features

- **Edge Functions**: For dynamic content generation
- **Image Optimization**: Automatic image optimization
- **Analytics**: Built-in web analytics
- **Speed Insights**: Performance monitoring

## Monitoring and Analytics

### Built-in Vercel Analytics

Enable in your Vercel dashboard:
- **Web Analytics**: Page views, unique visitors
- **Speed Insights**: Core Web Vitals monitoring
- **Function Logs**: Serverless function monitoring

### Google Analytics Integration

Set the environment variable:
```bash
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build logs in Vercel dashboard
   # Run build locally to debug
   npm run build:production
   ```

2. **Environment Variables Not Loading**:
   - Ensure variables are prefixed with `VITE_`
   - Check Vercel dashboard environment variables
   - Redeploy after adding new variables

3. **Routing Issues**:
   - Verify `vercel.json` rewrites configuration
   - Check React Router setup

4. **API Connection Issues**:
   - Verify `VITE_API_BASE_URL` is correct
   - Check CORS settings on backend
   - Ensure API is accessible from Vercel

### Debug Commands

```bash
# Local preview of production build
npm run preview:production

# Analyze bundle size
npm run build:analyze

# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]
```

## Security Considerations

### Headers Configuration

Security headers are configured in `vercel.json`:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

### Environment Variables

- Never commit `.env.production` to version control
- Use Vercel dashboard for sensitive variables
- Prefix client-side variables with `VITE_`

## Rollback Strategy

### Quick Rollback

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote [deployment-url]
```

### GitHub Rollback

1. Revert the problematic commit
2. Push to main branch
3. Automatic deployment will trigger

## Support

For deployment issues:
1. Check Vercel documentation
2. Review build logs in Vercel dashboard
3. Test locally with production build
4. Contact Vercel support if needed