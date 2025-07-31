# Admin Dashboard Monitoring Guide

This guide covers the monitoring and error tracking setup for the Reddit Content Platform Admin Dashboard.

## Overview

The admin dashboard includes comprehensive monitoring and error tracking capabilities:

- **Error Tracking**: Sentry integration for real-time error monitoring
- **Performance Monitoring**: Web Vitals tracking and custom performance metrics
- **User Analytics**: User behavior tracking and session analytics
- **Real-time Monitoring**: Performance monitor component for development

## Error Tracking with Sentry

### Setup

1. **Create Sentry Project**
   ```bash
   # Visit https://sentry.io and create a new React project
   # Get your DSN from the project settings
   ```

2. **Configure Environment Variables**
   ```bash
   # Production
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   VITE_SENTRY_ENVIRONMENT=production
   VITE_SENTRY_ORG=your-org-slug
   VITE_SENTRY_PROJECT=admin-dashboard
   VITE_APP_VERSION=1.0.0
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

3. **Features Enabled**
   - Automatic error capture
   - Performance monitoring
   - Session replay (10% sample rate)
   - Source map uploads
   - Release tracking

### Error Context

The dashboard automatically captures:
- JavaScript errors and unhandled promises
- React component errors (Error Boundary)
- Network request failures
- Performance issues
- User context and session information

### Manual Error Reporting

```typescript
import { captureException, captureMessage } from '@/lib/sentry';

// Report errors
try {
  // risky operation
} catch (error) {
  captureException(error, {
    context: 'user-action',
    userId: user.id,
  });
}

// Report messages
captureMessage('Important event occurred', 'info');
```

## Performance Monitoring

### Web Vitals Tracking

Automatically tracks Core Web Vitals:
- **CLS** (Cumulative Layout Shift)
- **FID** (First Input Delay)
- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **TTFB** (Time to First Byte)

### Custom Performance Metrics

```typescript
import { measurePerformance } from '@/utils/webVitals';

// Measure function performance
const result = measurePerformance('api-call', async () => {
  return await fetchData();
});

// Track custom metrics
trackPerformance('bundle-load-time', loadTime);
```

### Performance Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FID | ≤ 100ms | ≤ 300ms | > 300ms |
| FCP | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| TTFB | ≤ 800ms | ≤ 1.8s | > 1.8s |

## User Analytics

### Event Tracking

```typescript
import { useAnalytics } from '@/services/analyticsService';

const { track, trackClick, trackFeatureUsage } = useAnalytics();

// Track user interactions
trackClick('header-logo');
trackFeatureUsage('keywords', 'create');
track('custom-event', { property: 'value' });
```

### Automatic Tracking

- Page views and navigation
- Session start/end
- User identification
- Form submissions
- Search queries
- Error occurrences

### Privacy Considerations

- No PII is collected without explicit consent
- User data is anonymized where possible
- Analytics can be disabled via environment variables
- GDPR compliant data handling

## Real-time Performance Monitor

### Development Monitor

A floating performance monitor appears in development mode showing:
- Current Web Vitals scores
- Real-time performance ratings
- Color-coded status indicators

### Configuration

```typescript
// Enable/disable in environment
VITE_ENABLE_PERFORMANCE_MONITOR=true

// Show in production (not recommended)
VITE_ENABLE_PERFORMANCE_MONITOR=true
```

## Monitoring Dashboard

### Sentry Dashboard

Access your Sentry dashboard to view:
- Error frequency and trends
- Performance metrics
- User impact analysis
- Release health
- Session replays

### Custom Analytics Dashboard

If using custom analytics endpoint:
- User behavior flows
- Feature usage statistics
- Performance trends
- Error patterns

## Alerting and Notifications

### Sentry Alerts

Configure alerts for:
- Error rate spikes
- Performance degradation
- New error types
- Release health issues

### Custom Alerts

Set up alerts for:
- Bundle size increases
- Performance threshold breaches
- High error rates
- User experience issues

## Best Practices

### Error Handling

1. **Graceful Degradation**
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     captureException(error);
     showUserFriendlyMessage();
   }
   ```

2. **Context-Rich Errors**
   ```typescript
   captureException(error, {
     tags: { feature: 'keywords' },
     contexts: { user: userData },
     level: 'error',
   });
   ```

3. **Error Boundaries**
   ```typescript
   <SentryErrorBoundary fallback={ErrorFallback}>
     <Component />
   </SentryErrorBoundary>
   ```

### Performance Optimization

1. **Monitor Bundle Size**
   ```bash
   npm run build:analyze
   npm run size-check
   ```

2. **Track Performance Regressions**
   - Set up CI performance budgets
   - Monitor Web Vitals trends
   - Alert on performance degradation

3. **Optimize Based on Data**
   - Use real user metrics
   - Focus on high-impact optimizations
   - A/B test performance improvements

### Privacy and Compliance

1. **Data Minimization**
   - Only collect necessary data
   - Anonymize user information
   - Respect user preferences

2. **Consent Management**
   - Implement analytics consent
   - Provide opt-out mechanisms
   - Honor Do Not Track headers

3. **Data Retention**
   - Set appropriate retention periods
   - Regularly clean up old data
   - Comply with data protection laws

## Troubleshooting

### Common Issues

1. **Sentry Not Initializing**
   - Check DSN configuration
   - Verify environment variables
   - Ensure network connectivity

2. **Missing Source Maps**
   - Verify Sentry plugin configuration
   - Check auth token permissions
   - Ensure build process uploads maps

3. **Performance Data Missing**
   - Check Web Vitals library
   - Verify analytics endpoint
   - Ensure proper initialization

### Debug Commands

```bash
# Test Sentry configuration
npm run build:prod
# Check for Sentry plugin output

# Analyze bundle performance
npm run build:analyze

# Check performance monitoring
npm run dev
# Look for performance monitor in bottom-right
```

## Monitoring Checklist

- [ ] Sentry project created and configured
- [ ] Environment variables set for all environments
- [ ] Error boundaries implemented
- [ ] Performance monitoring enabled
- [ ] Analytics tracking configured
- [ ] Alerts set up for critical issues
- [ ] Privacy compliance verified
- [ ] Documentation updated
- [ ] Team trained on monitoring tools
- [ ] Incident response procedures defined

## Support and Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Privacy Regulations](https://gdpr.eu/)

For monitoring issues or questions, refer to the project documentation or contact the development team.